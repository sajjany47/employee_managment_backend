import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import timeRecord from "../model/timeData.model";
import moment from "moment";
import { getWeekendDates } from "../utility/utility";
import payroll from "../model/payroll.model";
import mongoose from "mongoose";

const generatePayroll = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);

    const currentMonth = moment(reqData.date).format("MM");
    const currentYear = moment(reqData.date).format("YYYY");
    const currentMonthYear = moment(reqData.date).format("YYYY-MM");

    const findValidMonth = await payroll.findOne({ date: currentMonthYear });

    if (moment(new Date()).format("YYYY-MM") === currentMonthYear) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Current month payroll cannnot generated" });
    } else {
      if (findValidMonth) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "This month payroll already generated" });
      } else {
        const findMonth = await timeRecord.aggregate([
          {
            $unwind: {
              path: "$timeSchedule",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              convertDate: {
                $toDate: "$timeSchedule.date",
              },
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [{ $year: "$convertDate" }, Number(currentYear)],
                  },
                  {
                    $eq: [{ $month: "$convertDate" }, Number(currentMonth)],
                  },
                ],
              },
              "timeSchedule.totalTime": { $ne: null },
            },
          },
          {
            $project: {
              "timeSchedule.date": 1,
              username: 1,
              _id: 0,
            },
          },
          {
            $group: {
              _id: "$username",
              date: {
                $push: {
                  date: "$timeSchedule.date",
                },
              },
            },
          },
          {
            $lookup: {
              from: "leavelists",
              localField: "_id",
              foreignField: "user_id",
              as: "leave",
            },
          },
          {
            $unwind: {
              path: "$leave",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $unwind: {
              path: "$leave.leaveDetail",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "leave.leaveDetail.leaveYear": currentYear,
            },
          },
          {
            $lookup: {
              from: "holidaylists",
              localField: "leave.leaveDetail.leaveYear",
              foreignField: "holidayYear",
              as: "holiday",
            },
          },
          {
            $unwind: {
              path: "$holiday",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "user_salary",
              localField: "_id",
              foreignField: "username",
              as: "salary",
            },
          },
          {
            $unwind: {
              path: "$salary",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              "leave.leaveDetail": 1,
              date: 1,
              "holiday.holidayList": 1,
              "salary.currentSalary": 1,
            },
          },
        ]);

        const currentMonthPayroll: any = [];
        findMonth.forEach((item: any) => {
          const filterLeave = item.leave.leaveDetail.leaveUseDetail.filter(
            (lea: any) => lea.leaveStatus === "approved"
          );

          const convertLeaveLeft = Number(
            item.leave.leaveDetail.totalLeaveLeft
          );
          const convertTotalLeave = Number(item.leave.leaveDetail.totalLeave);

          let totalLeave: any = [];
          filterLeave.length > 0 &&
            filterLeave.forEach((element: any) => {
              totalLeave.push(
                ...getWeekendDates(element.startDay, element.endDay)
              );
            });
          let currentLeaveList = [];
          let totalAbsent = 0;
          if (convertLeaveLeft >= 0) {
            const currentMonthLeave = totalLeave.filter(
              (a: any) => moment(a).format("YYYY-MM") === currentMonthYear
            );
            currentLeaveList.push(...currentMonthLeave);
            totalAbsent = 0;
          } else {
            const currentMonthLeave = totalLeave.filter(
              (a: any) => moment(a).format("YYYY-MM") === currentMonthYear
            );
            const accessLeaveUse =
              convertTotalLeave - convertLeaveLeft - convertTotalLeave;
            const absent = currentMonthLeave.length - accessLeaveUse;
            if (absent <= 0) {
              totalAbsent = currentMonthLeave.length;
            }
          }

          const filterHoliday = item.holiday.holidayList.filter(
            (res: any) =>
              moment(res.holidayDate).format("YYYY-MM") === currentMonthYear
          );
          const currentMontTotalDays = moment(new Date()).daysInMonth();
          const monthYear = currentMonthYear;
          const totalWeekHoliday: any = getWeekendDates(
            moment(`${monthYear}-01`, "YYYY-MM-DD"),
            moment(`${monthYear}-${currentMontTotalDays}`, "YYYY-MM-DD")
          );

          let userSalary: any = {};
          if (totalAbsent < 0) {
            (userSalary.basicSalary = item?.salary.currentSalary.basicSalary),
              (userSalary.hra = item?.salary.currentSalary.hra),
              (userSalary.travelAllowance =
                item?.salary.currentSalary.travelAllowance),
              (userSalary.MedicalAllowance =
                item?.salary.currentSalary.MedicalAllowance),
              (userSalary.LeaveTravelAllowance =
                item?.salary.currentSalary.LeaveTravelAllowance),
              (userSalary.SpecialAllowance =
                item?.salary.currentSalary.SpecialAllowance),
              (userSalary.providentFund =
                item?.salary.currentSalary.providentFund),
              (userSalary.professionalTax =
                item?.salary.currentSalary.professionalTax),
              (userSalary.incomeTax = item?.salary.currentSalary.incomeTax),
              (userSalary.totalEarning =
                item?.salary.currentSalary.totalEarning);
          } else {
            const basicSalary =
              item?.salary.currentSalary.basicSalary -
              (item?.salary.currentSalary.basicSalary / currentMontTotalDays) *
                totalAbsent;
            const hra =
              item?.salary.currentSalary.hra -
              (item?.salary.currentSalary.hra / currentMontTotalDays) *
                totalAbsent;
            const travelAllowance =
              item?.salary.currentSalary.travelAllowance -
              (item?.salary.currentSalary.travelAllowance /
                currentMontTotalDays) *
                totalAbsent;
            const MedicalAllowance =
              item?.salary.currentSalary.MedicalAllowance -
              (item?.salary.currentSalary.MedicalAllowance /
                currentMontTotalDays) *
                totalAbsent;
            const LeaveTravelAllowance =
              item?.salary.currentSalary.LeaveTravelAllowance -
              (item?.salary.currentSalary.LeaveTravelAllowance /
                currentMontTotalDays) *
                totalAbsent;
            const SpecialAllowance =
              item?.salary.currentSalary.SpecialAllowance -
              (item?.salary.currentSalary.SpecialAllowance /
                currentMontTotalDays) *
                totalAbsent;
            const otherDeduction =
              item?.salary.currentSalary.providentFund -
              (item?.salary.currentSalary.providentFund /
                currentMontTotalDays) *
                totalAbsent +
              (item?.salary.currentSalary.professionalTax -
                (item?.salary.currentSalary.professionalTax /
                  currentMontTotalDays) *
                  totalAbsent) +
              (item?.salary.currentSalary.incomeTax -
                (item?.salary.currentSalary.incomeTax / currentMontTotalDays) *
                  totalAbsent);

            /////////////////////////////////////////////////////////////////////////////////////////////////
            userSalary.basicSalary = basicSalary;
            userSalary.hra = hra;
            userSalary.travelAllowance = travelAllowance;
            userSalary.MedicalAllowance = MedicalAllowance;
            userSalary.LeaveTravelAllowance = LeaveTravelAllowance;
            userSalary.SpecialAllowance = SpecialAllowance;

            (userSalary.providentFund =
              item?.salary.currentSalary.providentFund),
              (userSalary.professionalTax =
                item?.salary.currentSalary.professionalTax),
              (userSalary.incomeTax = item?.salary.currentSalary.incomeTax);
            userSalary.totalEarning =
              basicSalary +
              hra +
              travelAllowance +
              MedicalAllowance +
              LeaveTravelAllowance +
              SpecialAllowance -
              (item?.salary.currentSalary.providentFund +
                item?.salary.currentSalary.professionalTax +
                item?.salary.currentSalary.incomeTax) -
              otherDeduction;
            userSalary.otherDeduction = otherDeduction;
          }

          currentMonthPayroll.push({
            username: item._id,
            date: moment(new Date()).format("YYYY-MM"),
            currentMonthTotalLeave: totalLeave.length,
            absent: totalAbsent,
            currentMonthTotalHoliday: filterHoliday.length,
            totalMonthDays: currentMontTotalDays,
            totalWeekend: currentMontTotalDays - totalWeekHoliday.length,
            salaryStatus: "pending",
            transactionNumber: null,
            transactionDate: null,
            accountNumber: null,
            currentMonthSalary: userSalary,
          });
        });
        return res.status(StatusCodes.OK).json({
          message: "Data fetched successfully",
          data: currentMonthPayroll,
        });
      }
    }
  } catch (error: any) {
    res.status(StatusCodes.OK).json({ message: error.message });
  }
};

const payrollUpdate = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const updateUserPayroll = await payroll.findOneAndUpdate(
      {
        date: moment(reqData.date).format("YYYY-MM"),
        "userPayroll._id": new mongoose.Types.ObjectId(reqData.payrollId),
      },
      {
        $set: {
          "userPayroll.$.salaryStatus": reqData.status,
          "userPayroll.$.transactionNumber": reqData.transactionNumber,
          "userPayroll.$.transactionDate": reqData.transactionDate,
          "userPayroll.$.accountNumber": reqData.accountNumber,
          "userPayroll.$.updatedBy": reqData.updatedBy,
          "userPayroll.$.updatedAt": reqData.updatedAt,
        },
      }
    );

    res.status(StatusCodes.OK).json({
      message: "Payroll updated successfully",
      data: updateUserPayroll,
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { generatePayroll, payrollUpdate };

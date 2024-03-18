import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import timeRecord from "../model/timeData.model";
import moment from "moment";
import { calculateSalary, getWeekendDates } from "../utility/utility";
import payroll from "../model/payroll.model";
import mongoose from "mongoose";
import user from "../model/user.model";

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
              from: "user_salaries",
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
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "username",
              as: "bank",
            },
          },
          {
            $unwind: {
              path: "$bank",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              "leave.leaveDetail": 1,
              date: 1,
              "holiday.holidayList": 1,
              "salary.currentSalary": 1,
              "bank.bankDetails": 1,
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

          let uniqueLeaveArray = [...new Set(totalLeave)];

          let currentLeaveList = [];
          let totalAbsent = 0;
          if (convertLeaveLeft >= 0) {
            const currentMonthLeave = uniqueLeaveArray.filter(
              (a: any) => moment(a).format("YYYY-MM") === currentMonthYear
            );
            currentLeaveList.push(...currentMonthLeave);
            totalAbsent = 0;
          } else {
            const currentMonthLeave = uniqueLeaveArray.filter(
              (a: any) => moment(a).format("YYYY-MM") === currentMonthYear
            );
            const accessLeaveUse = convertTotalLeave - convertLeaveLeft;
            const absent = currentMonthLeave.length - accessLeaveUse;
            if (absent <= 0) {
              totalAbsent = currentMonthLeave.length;
              currentLeaveList.push(...currentMonthLeave);
            }
          }

          const filterHoliday = item.holiday.holidayList.filter(
            (res: any) =>
              moment(res.holidayDate).format("YYYY-MM") === currentMonthYear
          );
          const currentMontTotalDays = moment(
            currentMonthYear,
            "YYYY-MM"
          ).daysInMonth();
          const monthYear = currentMonthYear;
          const totalWeekHoliday: any = getWeekendDates(
            moment(`${monthYear}-01`, "YYYY-MM-DD"),
            moment(`${monthYear}-${currentMontTotalDays}`, "YYYY-MM-DD")
          );

          const a = item?.salary.currentSalary;
          const b = currentMontTotalDays;
          const c = item.date.length;
          const d = totalWeekHoliday.length;
          const e = totalAbsent;
          const f = filterHoliday.length;
          const g = currentLeaveList.length;
          let userSalary: any = {
            basicSalary: calculateSalary(a.basicSalary, b, c, d, e, f, g),
            hra: calculateSalary(a.hra, b, c, d, e, f, g),
            travelAllowance: calculateSalary(
              a.travelAllowance,
              b,
              c,
              d,
              e,
              f,
              g
            ),
            MedicalAllowance: calculateSalary(
              a.MedicalAllowance,
              b,
              c,
              d,
              e,
              f,
              g
            ),
            LeaveTravelAllowance: calculateSalary(
              a.LeaveTravelAllowance,
              b,
              c,
              d,
              e,
              f,
              g
            ),
            SpecialAllowance: calculateSalary(
              a.SpecialAllowance,
              b,
              c,
              d,
              e,
              f,
              g
            ),
            providentFund: calculateSalary(a.providentFund, b, c, d, e, f, g),
            incomeTax: calculateSalary(a.incomeTax, b, c, d, e, f, g),
            professionalTax: a.professionalTax,
            healthInsurance: a.healthInsurance,
            ctc: a.ctc,
          };

          userSalary.totalEarning =
            userSalary.basicSalary +
            userSalary.hra +
            userSalary.travelAllowance +
            userSalary.MedicalAllowance +
            userSalary.LeaveTravelAllowance +
            userSalary.SpecialAllowance -
            userSalary.providentFund -
            userSalary.incomeTax -
            userSalary.professionalTax -
            userSalary.healthInsurance;

          currentMonthPayroll.push({
            username: item._id,
            date: currentMonthYear,
            present: item.date.length,
            currentMonthTotalLeave: currentLeaveList.length,
            absent: totalAbsent,
            currentMonthTotalHoliday: filterHoliday.length,
            totalMonthDays: currentMontTotalDays,
            totalWeekend: currentMontTotalDays - totalWeekHoliday.length,
            salaryStatus: "pending",
            transactionNumber: null,
            transactionDate: null,
            accountNumber: item.bank.bankDetails.accountNumber,
            bankName: item.bank.bankDetails.bankName,
            ifsc: item.bank.bankDetails.ifsc,
            branchName: item.bank.bankDetails.branchName,
            currentMonthSalary: userSalary,
          });
        });

        const monthPayrollAdd = new payroll({
          date: currentMonthYear,
          userPayroll: currentMonthPayroll,
        });

        const saveMonthPayroll = await monthPayrollAdd.save();
        return res.status(StatusCodes.OK).json({
          message: "Data fetched successfully",
          data: saveMonthPayroll,
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
        date: reqData.date,
        "userPayroll._id": new mongoose.Types.ObjectId(reqData.payrollId),
      },
      {
        $set: {
          "userPayroll.$.salaryStatus": reqData.salaryStatus,
          "userPayroll.$.currentMonthTotalLeave":
            reqData.currentMonthTotalLeave,
          "userPayroll.$.absent": reqData.absent,
          "userPayroll.$.currentMonthTotalHoliday":
            reqData.currentMonthTotalHoliday,
          "userPayroll.$.totalWeekend": reqData.totalWeekend,
          "userPayroll.$.currentMonthSalary": reqData.currentMonthSalary,
          "userPayroll.$.transactionNumber": reqData.transactionNumber,
          "userPayroll.$.transactionDate": reqData.transactionDate,
          "userPayroll.$.updatedBy": reqData.updatedBy,
          "userPayroll.$.updatedAt": moment(reqData.updatedAt).format(),
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

const payrollListMonthWise = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);

    const monthPayrollList = await payroll.findOne({
      date: moment(reqData.date).format("YYYY-MM"),
    });
    if (monthPayrollList) {
      return res
        .status(StatusCodes.OK)
        .json({ message: "Data fetched successfully", data: monthPayrollList });
    } else {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Payroll not generated" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const singleUserPayrollList = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const userPayroll = await payroll.aggregate([
      {
        $match: {
          date: moment(reqData.date).format("YYYY-MM"),
        },
      },
      {
        $unwind: {
          path: "$userPayroll",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          username: reqData.username,
        },
      },
      {
        $sort: { "userPayroll.salaryStatus": -1 },
      },
    ]);

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: userPayroll });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const salarySlipGenerate = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

// const createPDF = () => {
//   const pdf = new jsPDF("l", "pt", [1088, 1040]);
//   const data = document.querySelector("#genpdf");
//   pdf.html(data, { margin: 40 }).then(() => {
//     pdf.save(props?.paymentData?.invoiceNumber + ".pdf");
//   });
// };

export {
  generatePayroll,
  payrollUpdate,
  payrollListMonthWise,
  singleUserPayrollList,
};

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import timeRecord from "../model/timeData.model";
import moment from "moment";
import { getWeekendDates } from "../utility/utility";
import payroll from "../model/payroll.model";

const generatePayroll = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);

    const currentMonth = moment(reqData.date).format("MM");
    const currentYear = moment(reqData.date).format("YYYY");
    const currentMonthYear = moment(reqData.date).format("YYYY-MM");

    const findValidMonth = await payroll.findOne({ date: currentMonthYear });

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

        const convertLeaveLeft = Number(item.leave.leaveDetail.totalLeaveLeft);
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
            (userSalary.totalEarning = item?.salary.currentSalary.totalEarning);
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

          /////////////////////////////////////////////////////////////////////////////////////////////////
          userSalary.basicSalary = basicSalary;
          userSalary.hra = hra;
          userSalary.travelAllowance = travelAllowance;
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
            (userSalary.incomeTax = item?.salary.currentSalary.incomeTax);
        }

        currentMonthPayroll.push({
          username: item._id,
          currentMonthTotalLeave: totalLeave.length,
          absent: totalAbsent,
          currentMonthTotalHoliday: filterHoliday.length,
          totalDays: currentMontTotalDays,
          totalWeekend: currentMontTotalDays - totalWeekHoliday.length,
        });
      });
      return res.status(StatusCodes.OK).json({ data: currentMonthPayroll });
    }
  } catch (error: any) {
    res.status(StatusCodes.OK).json({ message: error.message });
  }
};

export { generatePayroll };

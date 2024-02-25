import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import timeRecord from "../model/timeData.model";
import moment from "moment";
import { getWeekendDates } from "../utility/utility";

const payrollList = async (req: Request, res: Response) => {
  try {
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
                $eq: [
                  { $year: "$convertDate" },
                  Number(moment(new Date()).format("YYYY")),
                ],
              },
              {
                $eq: [
                  { $month: "$convertDate" },
                  Number(moment(new Date()).format("MM")),
                ],
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
          "leave.leaveDetail.leaveYear": moment(new Date()).format("YYYY"),
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
        $project: {
          "leave.leaveDetail": 1,
          date: 1,
          "holiday.holidayList": 1,
        },
      },
    ]);

    const currentMonthPayroll: any = [];
    findMonth.forEach((item: any) => {
      const filterLeave = item.leave.leaveDetail.leaveUseDetail.filter(
        (lea: any) => lea.leaveStatus === "approved"
      );

      const convertLeaveLeft = Number(item.leave.leaveDetail.totalLeaveLeft);

      let totalLeave: any = [];
      filterLeave.length > 0 &&
        filterLeave.forEach((element: any) => {
          totalLeave.push(...getWeekendDates(element.startDay, element.endDay));
        });
      let currentLeaveList = [];
      if (convertLeaveLeft >= 0) {
        const currentMonthLeave = totalLeave.filter(
          (a: any) =>
            moment(a).format("YYYY-MM") === moment(new Date()).format("YYYY-MM")
        );
        currentLeaveList.push(...currentMonthLeave);
      } else {
        const sortDate = totalLeave.sort();
      }

      const filterHoliday = item.holiday.holidayList.filter(
        (res: any) =>
          moment(res.holidayDate).format("YYYY-MM") ===
          moment(new Date()).format("YYYY-MM")
      );
      currentMonthPayroll.push({
        username: item._id,
        currentMonthTotalLeave: totalLeave,
        currentMonthTotalHoliday: filterHoliday,
      });
    });
    res.status(StatusCodes.OK).json({ data: currentMonthPayroll });
  } catch (error: any) {
    res.status(StatusCodes.OK).json({ message: error.message });
  }
};

export { payrollList };

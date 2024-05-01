import { NextFunction, Request, Response } from "express";
import user from "../model/user.model";
import { StatusCodes } from "http-status-codes";
import timeRecord from "../model/timeData.model";
import moment from "moment";
import leave from "../model/leave.model";
import mongoose from "mongoose";
import holidayList from "../model/holiday.model";
import { getWeekendDates } from "../utility/utility";

const timeData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const dateFormat = moment(reqData.date).format("DD/MM/YYYY");
    const a: any = moment(reqData.startTime).format("YYYY-MM-DD HH:mm:ss");
    const b: any = moment(reqData.endTime).format("YYYY-MM-DD HH:mm:ss");
    const validUser = await user.findOne({ username: reqData.username });
    if (validUser) {
      const checkUser = await timeRecord.findOne({
        username: reqData.username,
      });
      if (checkUser) {
        let existingData: any[] = checkUser.timeSchedule;
        const findDateIndex: any = existingData.findIndex(
          (item: any) => item.date === dateFormat
        );
        if (findDateIndex > -1) {
          const indexData = existingData[findDateIndex];
          indexData.startTime = a;
          indexData.endTime = b;
          indexData.totalTime =
            indexData.totalTime + moment(b).diff(a, "minutes");
          existingData[findDateIndex] = indexData;

          const saveTimeData: any = await timeRecord.updateOne(
            { username: reqData.username },
            { $set: { timeSchedule: existingData } }
          );
          res.status(StatusCodes.OK).json({ message: "Added successfully" });
        } else {
          existingData.push({
            startTime: a,
            endTime: b,
            date: dateFormat,
            totalTime: moment(b).diff(a, "minutes"),
          });

          const saveTimeData: any = await timeRecord.updateOne(
            { username: reqData.username },
            { $set: { timeSchedule: existingData } }
          );
          res.status(StatusCodes.OK).json({ message: "Added successfully" });
        }
      } else {
        const modifyData = [
          {
            startTime: a,
            endTime: b,
            date: dateFormat,
            totalTime: moment(b).diff(a, "minutes"),
          },
        ];

        const userTimeRecord = new timeRecord({
          username: reqData.username,
          timeSchedule: modifyData,
        });
        const saveRecord = await userTimeRecord.save();
        res.status(StatusCodes.OK).json({ message: saveRecord });
      }
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "user not found" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const leaveApply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const findUser: any = await user.findOne({ _id: reqData.user_id });
    if (findUser) {
      const endDay = moment(reqData.endDay);
      const startDay = moment(reqData.startDay);
      const totalDays: any = moment.duration(endDay.diff(startDay)).as("days");
      const addLeave: any = {
        user_id: reqData._id,
        totalLeaveLeft: 8,
        totalLeave: 24,
        leaveDetails: [
          {
            startDay: moment(reqData.startDay).format("DD MMM, YYYY"),
            endDay: moment(reqData.endDay).format("DD MMM, YYYY"),
            totalDays: totalDays,
            leaveStatus: "pending",
            approvedBy: null,
          },
        ],
      };
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "User not found!" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const singleUserLeaveAdd = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const findUser = await user.findOne({ _id: reqData.user_id });

    if (findUser) {
      const saveData: any = new leave({
        user_id: reqData.user_id,
        totalLeave: reqData.totalLeave,
        updatedBy: reqData.updatedBy,
      });

      await saveData.save();
      res.status(StatusCodes.OK).json({ message: "Successfully leave added" });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "User not found!" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const multiUserLeaveAdd = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const modiifyBulkUser: any = reqData.bulkUser.map(
      (item: any) => new mongoose.Types.ObjectId(item.user_id)
    );
    const findUser = await user.aggregate([
      {
        $match: {
          _id: {
            $in: modiifyBulkUser,
          },
        },
      },
    ]);

    if (findUser.length) {
      leave.insertMany(reqData.bulkUser);
      res.status(StatusCodes.OK).json({ message: "Successfully leave added" });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "User not found!" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const userTimeDetails = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    if (moment(reqData.date).day() !== 0 && moment(reqData.date).day() !== 6) {
      const checkHolidayList: any = await holidayList.findOne({
        "holidayList.holidayDate": moment(reqData.date).format("YYYY-MM-DD"),
      });
      if (checkHolidayList) {
        return res.status(StatusCodes.OK).json({ message: "Today is Holiday" });
      } else {
        const checkValidUser = await user.findOne({
          username: reqData.username,
        });
        if (checkValidUser) {
          const checkLeave: any = await leave.aggregate([
            {
              $match: {
                user_id: reqData.username,
              },
            },
            {
              $unwind: {
                path: "$leaveDetail",
              },
            },
            {
              $match: {
                "leaveDetail.leaveYear": moment(reqData.date).format("YYYY"),
              },
            },
          ]);

          if (checkLeave.length > 0) {
            const filterLeave = checkLeave[0].leaveDetail.leaveUseDetail.filter(
              (item: any) => item.leaveStatus === "approved"
            );

            const leaveList = [];
            filterLeave.forEach((element: any) => {
              for (
                let date: any = moment(element.startDay);
                date.isSameOrBefore(moment(element.startDay));
                date.add(1, "days")
              ) {
                if (date.day() !== 0 && date.day() !== 6) {
                  if (
                    moment(date).format("YYYY-MM-DD") ===
                    moment(reqData.date).format("YYYY-MM-DD")
                  ) {
                    leaveList.push(moment(date).format("YYYY-MM-DD"));
                  }
                }
              }
            });
            if (leaveList.length > 0) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                message: "You already applied leave on today ! contact HR team",
              });
            } else {
              const findUser = await timeRecord.findOne({
                username: reqData.username,
              });
              if (findUser) {
                const findValidDate = await timeRecord.findOne({
                  username: reqData.username,
                  "timeSchedule.date": moment(reqData.date).format(
                    "YYYY-MM-DD"
                  ),
                });
                if (findValidDate) {
                  return res.status(StatusCodes.BAD_REQUEST).json({
                    message:
                      "Already today attendance created ! contact HR team",
                  });
                } else {
                  await timeRecord.findOneAndUpdate(
                    {
                      username: reqData.username,
                    },
                    {
                      $push: {
                        timeSchedule: {
                          date: moment(reqData.date).format("YYYY-MM-DD"),
                          totalTime: reqData.totalTime,
                          startTime: new Date(reqData.startTime),
                          endTime: new Date(reqData.endTime),
                        },
                      },
                    }
                  );

                  return res
                    .status(StatusCodes.OK)
                    .json({ message: "Time recorded successfully" });
                }
              } else {
                const insertTimeRecord = new timeRecord({
                  username: reqData.username,
                  timeSchedule: [
                    {
                      date: moment(reqData.date).format("YYYY-MM-DD"),
                      totalTime: reqData.totalTime,
                      startTime: new Date(reqData.startTime),
                      endTime: new Date(reqData.endTime),
                    },
                  ],
                });

                await insertTimeRecord.save();

                return res
                  .status(StatusCodes.OK)
                  .json({ message: "Time recorded successfully" });
              }
            }
          } else {
            res
              .status(StatusCodes.BAD_REQUEST)
              .json({ message: "User leave not alloted" });
          }
        } else {
          return res
            .status(StatusCodes.NOT_FOUND)
            .json({ message: "User not found!" });
        }
      }
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Today is weekend holiday" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const userTimeData = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    if (moment(reqData.date).day() !== 0 && moment(reqData.date).day() !== 6) {
      const checkHolidayList: any = await holidayList.findOne({
        "holidayList.holidayDate": moment(reqData.date).format("YYYY-MM-DD"),
      });
      if (checkHolidayList) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Today is Holiday" });
      } else {
        const checkValidUser = await user.findOne({
          username: reqData.username,
        });
        if (checkValidUser) {
          const checkLeave: any = await leave.aggregate([
            {
              $match: {
                user_id: reqData.username,
              },
            },
            {
              $unwind: {
                path: "$leaveDetail",
              },
            },
            {
              $match: {
                "leaveDetail.leaveYear": moment(reqData.date).format("YYYY"),
              },
            },
          ]);

          if (checkLeave.length > 0) {
            const filterLeave = checkLeave[0].leaveDetail.leaveUseDetail.filter(
              (item: any) => item.leaveStatus === "approved"
            );

            const leaveList = [];
            filterLeave.forEach((element: any) => {
              const weekends = getWeekendDates(
                moment(element.startDay).format("YYYY-MM-DD"),
                moment(element.startDay).format("YYYY-MM-DD")
              );

              weekends.forEach((item: any) => {
                if (
                  moment(item).format("YYYY-MM-DD") ===
                  moment(reqData.date).format("YYYY-MM-DD")
                ) {
                  leaveList.push(moment(item).format("YYYY-MM-DD"));
                }
              });
              // for (
              //   let date: any = moment(element.startDay);
              //   date.isSameOrBefore(moment(element.startDay));
              //   date.add(1, "days")
              // ) {
              //   if (date.day() !== 0 && date.day() !== 6) {
              //     if (
              //       moment(date).format("YYYY-MM-DD") ===
              //       moment(reqData.date).format("YYYY-MM-DD")
              //     ) {
              //       leaveList.push(moment(date).format("YYYY-MM-DD"));
              //     }
              //   }
              // }
            });
            if (leaveList.length > 0) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                message: "You already applied leave on today ! contact HR team",
              });
            } else {
              const findUser = await timeRecord.findOne({
                username: reqData.username,
              });
              if (findUser) {
                const findValidDate = await timeRecord.findOne({
                  username: reqData.username,
                  "timeSchedule.date": moment(reqData.date).format(
                    "YYYY-MM-DD"
                  ),
                });
                if (findValidDate) {
                  const findDate = findValidDate.timeSchedule.find(
                    (item: any) =>
                      moment(item.startTime).format("YYYY-MM-DD") ===
                      moment(reqData.endTime).format("YYYY-MM-DD")
                  );
                  if (findDate) {
                    const findValidDateUpdate = await timeRecord.updateOne(
                      {
                        username: reqData.username,
                        "timeSchedule.date": moment(reqData.date).format(
                          "YYYY-MM-DD"
                        ),
                      },
                      {
                        $set: {
                          "timeSchedule.$.endTime": moment(
                            reqData.endTime
                          ).format(),
                          "timeSchedule.$.totalTime": reqData.totalTime,
                          "timeSchedule.$.startDisabled": true,
                          "timeSchedule.$.endDisabled": true,
                        },
                      }
                    );
                    return res.status(StatusCodes.OK).json({
                      message: "Today attendance created",
                    });
                  } else {
                    return res
                      .status(StatusCodes.BAD_REQUEST)
                      .json({ message: "Start Date and End Date not match" });
                  }
                } else {
                  await timeRecord.findOneAndUpdate(
                    {
                      username: reqData.username,
                    },
                    {
                      $push: {
                        timeSchedule: {
                          date: moment(reqData.date).format("YYYY-MM-DD"),
                          startDisabled: true,
                          endDisabled: false,
                          totalTime: null,
                          startTime: moment(reqData.startTime).format(),
                          endTime: null,
                          updatedBy: null,
                        },
                      },
                    }
                  );

                  return res
                    .status(StatusCodes.OK)
                    .json({ message: "Time recorded successfully" });
                }
              } else {
                const insertTimeRecord = new timeRecord({
                  username: reqData.username,
                  timeSchedule: [
                    {
                      date: moment(reqData.date).format("YYYY-MM-DD"),
                      totalTime: null,
                      startTime: moment(reqData.startTime).format(),
                      endTime: null,
                      startDisabled: true,
                      endDisabled: false,
                      updatedBy: null,
                    },
                  ],
                });

                await insertTimeRecord.save();

                return res
                  .status(StatusCodes.OK)
                  .json({ message: "Time recorded successfully" });
              }
            }
          } else {
            res
              .status(StatusCodes.BAD_REQUEST)
              .json({ message: "User leave not alloted" });
          }
        } else {
          return res
            .status(StatusCodes.NOT_FOUND)
            .json({ message: "User not found!" });
        }
      }
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Today is weekend holiday" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const userDailyCheck = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const findUserDate = await timeRecord.findOne({
      username: reqData.username,
      "timeSchedule.date": moment(reqData.checkDate).format("YYYY-MM-DD"),
    });
    if (findUserDate) {
      const findDate = findUserDate.timeSchedule.find(
        (item: any) =>
          moment(item.date).format("YYYY-MM-DD") ===
          moment(reqData.checkDate).format("YYYY-MM-DD")
      );

      return res
        .status(StatusCodes.OK)
        .json({ message: "Data fetched successfully", data: findDate });
    } else {
      return res.status(StatusCodes.OK).json({
        message: "Data fetched successfully",
        data: {
          startDisabled: false,
          endDisabled: true,
          startTime: null,
          endTime: null,
          totalTime: null,
          date: moment(reqData.checkDate).format("YYYY-MM-DD"),
          updatedBy: null,
        },
      });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const userAttendanceDetails = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const userData = await timeRecord.aggregate([
      {
        $match: {
          username: reqData.username,
        },
      },
      {
        $unwind: {
          path: "$timeSchedule",
        },
      },
      {
        $sort: {
          "timeSchedule.date": -1,
        },
      },
    ]);

    if (userData) {
      const filterData = userData.filter(
        (item: any) =>
          moment(item.timeSchedule.date).format("MM-YYYY") ===
            moment(reqData.date).format("MM-YYYY") &&
          moment(item.timeSchedule.date).format("YYYY-MM-DD") !==
            moment(new Date()).format("YYYY-MM-DD")
      );

      return res
        .status(StatusCodes.OK)
        .json({ message: "Data fetched successfully", data: filterData });
    } else {
      return res
        .status(StatusCodes.OK)
        .json({ message: "Data fetched successfully", data: [] });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const userInvalidAttendance = async (req: Request, res: Response) => {
  try {
    const inValidAttendance = await timeRecord.aggregate([
      {
        $unwind: {
          path: "$timeSchedule",
        },
      },
      {
        $match: {
          "timeSchedule.startTime": { $ne: null },
          "timeSchedule.endTime": null,
          "timeSchedule.date": { $ne: moment(new Date()).format("YYYY-MM-DD") },
        },
      },
    ]);

    return res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: inValidAttendance });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const inValidAttendanceChange = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const updateData = await timeRecord.findOneAndUpdate(
      {
        "timeSchedule._id": new mongoose.Types.ObjectId(reqData.id),
      },
      {
        $set: {
          "timeSchedule.$.startTime": moment(reqData.startTime).format(),
          "timeSchedule.$.endTime": moment(reqData.endTime).format(),
          "timeSchedule.$.totalTime": reqData.totalTime,
          "timeSchedule.$.updatedBy": reqData.updatedBy,
        },
      }
    );

    return res
      .status(StatusCodes.OK)
      .json({ message: "Attendance updated successfully", data: updateData });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const attendanceList = async (req: Request, res: Response) => {
  try {
    const year = moment(req.body.date).format("YYYY");
    const month = moment(req.body.date).format("MM");
    const reqData = req.body;
    const page = reqData.page;
    const limit = reqData.limit;
    const start = page * limit - limit;
    const query: any[] = [];

    if (reqData.hasOwnProperty("username")) {
      query.push({
        username: { $regex: `^${reqData.username}`, $options: "i" },
      });
    }
    const result = await timeRecord.aggregate([
      {
        $match: query.length > 0 ? { $and: query } : {},
      },
      {
        $skip: start,
      },
      {
        $limit: limit,
      },
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
                $eq: [{ $year: "$convertDate" }, Number(year)],
              },
              {
                $eq: [{ $month: "$convertDate" }, Number(month)],
              },
            ],
          },
          "timeSchedule.totalTime": { $ne: null },
        },
      },
      {
        $lookup: {
          from: "leavelists",
          localField: "username",
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
          "leave.leaveDetail.leaveYear": `${year}`,
        },
      },
      {
        $group: {
          _id: "$_id",
          username: { $first: "$username" },
          totalLeave: {
            $first: "$leave.leaveDetail.totalLeave",
          },
          totalLeaveLeft: {
            $first: "$leave.leaveDetail.totalLeaveLeft",
          },
          date: { $first: `${moment(req.body.date).format("YYYY-MM")}` },
          timeSchedule: { $push: "$timeSchedule" },
          totalTime: {
            $sum: "$timeSchedule.totalTime",
          },
        },
      },
    ]);

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: result });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export {
  timeData,
  leaveApply,
  singleUserLeaveAdd,
  multiUserLeaveAdd,
  userTimeData,
  userDailyCheck,
  userAttendanceDetails,
  userInvalidAttendance,
  inValidAttendanceChange,
  attendanceList,
};

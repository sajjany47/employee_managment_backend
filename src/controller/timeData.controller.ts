import { NextFunction, Request, Response } from "express";
import user from "../model/user.model";
import { StatusCodes } from "http-status-codes";
import timeRecord from "../model/timeData.model";
import moment from "moment";
import leave from "../model/leave.model";
import mongoose from "mongoose";
import holidayList from "../model/holiday.model";

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

const userTimeData = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    if (moment(reqData.date).day() !== 0 && moment(reqData.date).day() !== 6) {
      const checkHolidayList: any = await holidayList.findOne({
        "holidayList.holidayDate": new Date(reqData.date),
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

export {
  timeData,
  leaveApply,
  singleUserLeaveAdd,
  multiUserLeaveAdd,
  userTimeData,
};

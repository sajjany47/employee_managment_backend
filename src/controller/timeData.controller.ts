import { NextFunction, Request, Response } from "express";
import user from "../model/user.model";
import { StatusCodes } from "http-status-codes";
import timeRecord from "../model/timeData.model";
import moment from "moment";

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

export { timeData };

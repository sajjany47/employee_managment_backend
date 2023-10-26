import { NextFunction, Request, Response } from "express";
import user from "../model/user.model";
import { StatusCodes } from "http-status-codes";
import timeRecord from "../model/timeData.model";
import moment from "moment";

const timeData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const validUser = await user.findOne({ username: reqData.username });
    if (validUser) {
      const checkUser = await timeRecord.findOne({
        username: reqData.username,
      });
      if (checkUser) {
      } else {
        const dateFormat = moment(reqData.date).format("DD/MM/YYYY");
        const a: any = new Date(reqData.startTime);
        const b: any = new Date(reqData.endTime);

        const modifyData = [
          {
            date: dateFormat,
            time: b.diff(a, "minutes"),
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
  } catch (error) {}
};

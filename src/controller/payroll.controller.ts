import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import timeRecord from "../model/timeData.model";
import moment from "moment";

const payrollList = async (req: Request, res: Response) => {
  try {
    const findMonth = await timeRecord.find({
      from: {
        "timeSchedule.date": { $regex: "2024-02" },
      },
    });
    console.log(findMonth);
  } catch (error: any) {
    res.status(StatusCodes.OK).json({ message: error.message });
  }
};

export { payrollList };

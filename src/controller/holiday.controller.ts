import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import holidayList from "../model/holiday.model";
import moment from "moment";

const holidayListData = async (req: Request, res: Response) => {
  try {
    const reqData: any = Object.assign({}, req.body);

    const holidayData: any = new holidayList({
      holidayList: reqData.holidayList,
      updatedBy: reqData.updatedBy,
    });

    const saveData = await holidayData.save();

    res
      .status(StatusCodes.OK)
      .json({ message: "Holiday List created successfully", data: saveData });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const createHolidayList = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const formatYear: any = moment(reqData.holidayDate).format("YYYY");
    const findYear: any = holidayList.findOne({ holidayYear: formatYear });
    if (findYear) {
    } else {
    }
  } catch (error) {}
};

export { holidayListData };

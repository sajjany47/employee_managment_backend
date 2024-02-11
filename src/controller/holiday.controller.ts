import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import holidayList from "../model/holiday.model";
import moment from "moment";
import mongoose from "mongoose";

const holidayListData = async (req: Request, res: Response) => {
  try {
    const year: any = req.params;

    // const holidayListData: any = await holidayList
    //   .findOne({
    //     holidayYear: year.id,
    //   })

    const holidayListData: any = await holidayList.aggregate([
      {
        $match: {
          holidayYear: year.id,
        },
      },

      { $unwind: "$holidayList" },
      {
        $sort: {
          "holidayList.holidayDate": 1,
        },
      },
    ]);
    res.status(StatusCodes.OK).json({
      message: "Holiday List fetched successfully",
      data: holidayListData,
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const createHolidayList = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);

    const formatYear: any = moment(reqData.holidayDate).format("YYYY");
    const findYear: any = await holidayList.findOne({
      holidayYear: formatYear,
    });
    if (findYear) {
      const findHolidayList: any = await holidayList.findOne({
        holidayYear: formatYear,
        "holidayList.holidayDate": moment(reqData.holidayDate).format(
          "YYYY-MM-DD"
        ),
      });

      if (findHolidayList) {
        res
          .status(StatusCodes.CONFLICT)
          .json({ message: "Holiday Date already Added" });
      } else {
        const updateData: any = await holidayList.updateOne(
          {
            holidayYear: formatYear,
          },
          {
            $push: {
              holidayList: {
                holidayDate: moment(reqData.holidayDate).format("YYYY-MM-DD"),
                reason: reqData.reason,
                createdBy: reqData.createdBy,
              },
            },
          }
        );

        res.status(StatusCodes.OK).json({
          message: "Holiday Date added successfully",
          data: updateData,
        });
      }
    } else {
      const holidayData: any = new holidayList({
        holidayYear: formatYear,
        holidayList: {
          holidayDate: moment(reqData.holidayDate).format("YYYY-MM-DD"),
          reason: reqData.reason,
          createdBy: reqData.createdBy,
        },
      });

      const saveData = await holidayData.save();

      res.status(StatusCodes.OK).json({
        message: "Holiday List created successfully",
        data: saveData,
      });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const deleteHolidayList = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);

    const deleteHoliday: any = await holidayList.updateOne(
      {
        holidayYear: reqData.holidayYear,
      },
      {
        $pull: {
          holidayList: {
            _id: new mongoose.Types.ObjectId(reqData._id),
          },
        },
      }
    );

    res.status(StatusCodes.OK).json({
      message: "Holiday date deleted successfully",
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { createHolidayList, holidayListData, deleteHolidayList };

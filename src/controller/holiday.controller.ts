import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import holidayList from "../model/holiday.model";
import moment from "moment";
import mongoose from "mongoose";
import Excel, { Workbook } from "exceljs";

const holidayListData = async (req: Request, res: Response) => {
  try {
    const year: any = req.params;

    const holidayListData: any = await holidayList.aggregate([
      {
        $match: {
          holidayYear: year.id,
        },
      },

      { $unwind: "$holidayList" },
      {
        $sort: {
          "holidayList.holidayDate": -1,
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
                createdBy: reqData.user.username,
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
        holidayList: [
          {
            holidayDate: moment(reqData.holidayDate).format("YYYY-MM-DD"),
            reason: reqData.reason,
            createdBy: reqData.user.username,
          },
        ],
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

const downloadeBlankExcelHoliday = async (req: Request, res: Response) => {
  try {
    const workbook = new Excel.Workbook();
    const workSheet = workbook.addWorksheet("Holiday List");
    const headerRow = ["Date", "Holiday Reason"];

    workSheet.addRow(headerRow);
    workbook.xlsx.writeFile("my-file.xlsx");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "holiday.xlsx"
    );
    workbook.xlsx.write(res).then(() => res.end());
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const readExcelHoliday = async (req: Request, res: Response) => {
  try {
    const excelFile: any = req.files.files;
    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(excelFile.data);
    const worksheet = workbook.worksheets[0];
    const headers: any = [];
    const rows: any = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers.push(cell.value);
        });
      } else {
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value;
        });
        rows.push(rowData);
      }
    });

    const year = moment(rows[0].Date).format("YYYY");

    const checkValidYear = rows.filter(
      (item: any) => moment(item.Date).format("YYYY") !== year
    );

    if (checkValidYear.length > 0) {
      return res.status(StatusCodes.NOT_ACCEPTABLE).json({
        message: "Holiday year should be same",
        data: checkValidYear,
      });
    } else {
      const modifyData = rows.map((item: any) => ({
        holidayDate: moment(item.Date).format("YYYY-MM-DD"),
        reason: item["Holiday Reason"],
        createdBy: req.body.user.username,
      }));

      return res
        .status(StatusCodes.OK)
        .json({ message: "Excel read successfully", data: modifyData });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const excelInsertHoliday = async (req: Request, res: Response) => {
  try {
    const list = req.body.list;

    const checkValidHolidayYear = await holidayList.findOne({
      holidayYear: moment(list[0].holidayDate).format("YYYY"),
    });

    if (checkValidHolidayYear) {
      const updateHoliday = await holidayList.updateOne();
    } else {
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { createHolidayList, holidayListData, deleteHolidayList };

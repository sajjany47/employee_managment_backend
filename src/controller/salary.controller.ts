import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import salary from "../model/salary.model";
import user from "../model/user.model";
import mongoose from "mongoose";
import moment from "moment";

const userSalaryCreate = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const requestBody = {
      basicSalary: Number(reqData.basicSalary),
      hra: Number(reqData.hra),
      travelAllowance: Number(reqData.travelAllowance),
      MedicalAllowance: Number(reqData.MedicalAllowance),
      LeaveTravelAllowance: Number(reqData.LeaveTravelAllowance),
      SpecialAllowance: Number(reqData.SpecialAllowance),
      providentFund: Number(reqData.providentFund),
      professionalTax: Number(reqData.professionalTax),
      incomeTax: Number(reqData.incomeTax),
      incrementType: reqData.incrementType,
      incrementValue:
        reqData.hasOwnProperty("incrementValue") &&
        reqData.incrementValue !== ""
          ? Number(reqData.incrementValue)
          : null,
      totalEarning: Number(reqData.totalEarning),
      updatedBy: reqData.updatedBy,
      date: moment(new Date(reqData.date)).format(),
      healthInsurance: Number(reqData.healthInsurance),
      ctc: Number(reqData.ctc),
      type: reqData.type,
    };
    const findUser = await salary.findOne({ username: reqData.username });
    if (findUser) {
      if (reqData.type === "changes") {
        const userSalaryUpdate = await salary.findOneAndUpdate(
          {
            username: reqData.username,
            "salaryHistory._id": new mongoose.Types.ObjectId(reqData.id),
          },
          {
            $set: {
              currentSalary: requestBody,
              "salaryHistory.$.hra": Number(reqData.hra),
              "salaryHistory.$.incrementType": reqData.incrementType,
              "salaryHistory.$.incrementValue": Number(reqData.incrementValue),
              "salaryHistory.$.basicSalary": Number(reqData.basicSalary),
              "salaryHistory.$.travelAllowance": Number(
                reqData.travelAllowance
              ),
              "salaryHistory.$.MedicalAllowance": Number(
                reqData.MedicalAllowance
              ),
              "salaryHistory.$.LeaveTravelAllowance": Number(
                reqData.LeaveTravelAllowance
              ),
              "salaryHistory.$.SpecialAllowance": Number(
                reqData.SpecialAllowance
              ),
              "salaryHistory.$.providentFund": Number(reqData.providentFund),
              "salaryHistory.$.professionalTax": Number(
                reqData.professionalTax
              ),
              "salaryHistory.$.incomeTax": Number(reqData.incomeTax),
              "salaryHistory.$.totalEarning": Number(reqData.totalEarning),
              "salaryHistory.$.updatedBy": reqData.updatedBy,
              "salaryHistory.$.date": reqData.date,
              "salaryHistory.$.healthInsurance": Number(
                reqData.healthInsurance
              ),
              "salaryHistory.$.ctc": Number(reqData.ctc),
            },
          }
        );
        return res.status(StatusCodes.OK).json({
          message: "User salary structure updated successfully",
          data: userSalaryUpdate,
        });
      } else {
        const userSalaryUpdate = await salary.findOneAndUpdate(
          { username: reqData.username },
          {
            $set: {
              currentSalary: requestBody,
            },
            $push: {
              salaryHistory: requestBody,
            },
          }
        );
        return res.status(StatusCodes.OK).json({
          message: "User salary structure updated successfully",
          data: userSalaryUpdate,
        });
      }
    } else {
      const userSalary = new salary({
        username: reqData.username,
        currentSalary: requestBody,
        salaryHistory: [requestBody],
      });

      await userSalary.save();

      return res.status(StatusCodes.OK).json({
        message: "User Salary Structure Created Successfully",
      });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const salaryUserAlloted = async (req: Request, res: Response) => {
  try {
    const userList = await user.find(
      { activeStatus: true },
      { username: 1, name: 1, _id: 0 }
    );
    const allotedSalaryList = await salary.find({});

    const removeDuplicateUser = userList.filter(
      (item1) =>
        !allotedSalaryList.some((item2) => item1.username === item2.username)
    );
    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: removeDuplicateUser,
    });
  } catch (error: any) {
    res.status(StatusCodes.OK).json({ message: error.message });
  }
};

const salaryList = async (req: Request, res: Response) => {
  try {
    const reqData = req.body;
    const page = reqData.page;
    const limit = reqData.limit;
    const start = page * limit - limit;
    const query: any[] = [];

    if (reqData.hasOwnProperty("username")) {
      query.push({ username: reqData.username });
    }

    const data: any[] = await Promise.all([
      salary.countDocuments([
        { $match: query.length > 0 ? { $and: query } : {} },
      ]),
      salary.aggregate([
        { $match: query.length > 0 ? { $and: query } : {} },
        {
          $sort: reqData.hasOwnProperty("sort")
            ? reqData.sort
            : { username: 1 },
        },
        {
          $skip: start,
        },
        {
          $limit: limit,
        },
      ]),
    ]);
    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: data[1],
      count: data[0],
    });
  } catch (error: any) {
    res.status(StatusCodes.OK).json({ message: error.message });
  }
};

const singleUserList = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = await salary.findOne({ username: id });
    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: data });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { userSalaryCreate, salaryList, salaryUserAlloted, singleUserList };

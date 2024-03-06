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
      basicSalary: reqData.basicSalary,
      hra: reqData.hra,
      travelAllowance: reqData.travelAllowance,
      MedicalAllowance: reqData.MedicalAllowance,
      LeaveTravelAllowance: reqData.LeaveTravelAllowance,
      SpecialAllowance: reqData.SpecialAllowance,
      providentFund: reqData.providentFund,
      professionalTax: reqData.professionalTax,
      incomeTax: reqData.incomeTax,
      incrementType: reqData.incrementType,
      incrementValue: reqData.incrementValue,
      totalEarning: reqData.totalEarning,
      updatedBy: reqData.updatedBy,
      date: moment(new Date(reqData.date)).format(),
      healthInsurance: reqData.healthInsurance,
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
              "salaryHistory.$.hra": reqData.hra,
              "salaryHistory.$.basicSalary": reqData.basicSalary,
              "salaryHistory.$.travelAllowance": reqData.travelAllowance,
              "salaryHistory.$.MedicalAllowance": reqData.MedicalAllowance,
              "salaryHistory.$.LeaveTravelAllowance":
                reqData.LeaveTravelAllowance,
              "salaryHistory.$.SpecialAllowance": reqData.SpecialAllowance,
              "salaryHistory.$.providentFund": reqData.providentFund,
              "salaryHistory.$.professionalTax": reqData.professionalTax,
              "salaryHistory.$.incomeTax": reqData.incomeTax,
              "salaryHistory.$.totalEarning": reqData.totalEarning,
              "salaryHistory.$.updatedBy": reqData.updatedBy,
              "salaryHistory.$.date": reqData.date,
              "salaryHistory.$.healthInsurance": reqData.healthInsurance,
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
    const allotedSalaryList = await salary.find({});

    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: allotedSalaryList,
    });
  } catch (error: any) {
    res.status(StatusCodes.OK).json({ message: error.message });
  }
};

export { userSalaryCreate, salaryList, salaryUserAlloted };

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import salary from "../model/salary.model";

const userSalaryCreate = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const findUser = await salary.findOne({ username: reqData.username });
    if (findUser) {
      const userSalaryUpdate = await salary.findOneAndUpdate(
        { username: reqData.username },
        {
          $set: {
            currentSalary: {
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
              date: reqData.date,
            },
          },
          $push: {
            salaryHistory: {
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
              date: reqData.date,
            },
          },
        }
      );
      return res.status(StatusCodes.OK).json({
        message: "User salary structure updated successfully",
        data: userSalaryUpdate,
      });
    } else {
      const userSalary = new salary({
        currentSalary: {
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
          date: reqData.date,
        },
        salaryHistory: [
          {
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
            date: reqData.date,
          },
        ],
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

export { userSalaryCreate };

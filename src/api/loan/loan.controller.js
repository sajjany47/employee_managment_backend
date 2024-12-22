import { StatusCodes } from "http-status-codes";
import {
  ApplicationStatusSchema,
  LeadSchema,
  PersonalLoanAccountSchema,
  PersonalLoanAddressSchema,
  PersonalLoanBasicSchema,
  PersonalLoanDocumentSchema,
  PersonalLoanWorkSchema,
} from "./loan.schema.js";
import Loan from "./loan.model.js";
import mongoose from "mongoose";
import {
  DisbursmentCalculate,
  EMICalculator,
  GenerateApplicationNumber,
  LoanApplicationStepsEnum,
  LoanDivide,
  LoanImageUpload,
  LoanStatusEnum,
} from "./loan.config.js";
import loanType from "../document/loanType.model.js";
import {
  AccountData,
  AddressData,
  BasicData,
  LeadData,
  StatusData,
  WorkData,
} from "./PersonalLoan.js";
import { BuildRegexQuery, GLocalImage } from "../../utilis/utilis.js";
import { Position, PositionWiseData } from "../employess/EmployeeConfig.js";
import fs from "fs";
import branch from "../branch/branch.model.js";
import employee from "../employess/employee.model.js";

export const ApplicationCreate = async (req, res) => {
  try {
    const type = req.body.applicationType;
    const validationSchema =
      type === "lead"
        ? LeadSchema
        : type === "basic"
        ? PersonalLoanBasicSchema
        : "";
    const validateData = await validationSchema.validate(req.body);

    if (validateData) {
      const findLoanDetails = await loanType.findOne({
        _id: new mongoose.Types.ObjectId(validateData.loanType),
      });

      const data =
        type === "lead"
          ? LeadData(validateData)
          : type === "basic"
          ? BasicData(validateData)
          : "";
      const LeadCreate = new Loan({
        ...data,
        leadAssignAgent: req.user._id,
        applicationNumber:
          validateData.applicationType === "lead"
            ? `L-${GenerateApplicationNumber(findLoanDetails.entity)}`
            : `${GenerateApplicationNumber(findLoanDetails.entity)}`,

        createdBy: req.user._id,
      });

      const applicationSave = await LeadCreate.save();

      if (applicationSave) {
        if (req.user.position !== Position.LD) {
          const selectEmployee = await LoanDivide(
            Position.LD,
            validateData.branch
          );
          if (selectEmployee) {
            await loanType.updateOne(
              { _id: new mongoose.Types.ObjectId(applicationSave._id) },
              {
                $set: {
                  assignAgent: new mongoose.Types.ObjectId(selectEmployee),
                },
              }
            );
          }
        }
      }

      res.status(StatusCodes.OK).json({
        data: applicationSave,
        message: `${
          type === "lead" ? "Lead" : "Application"
        } created successfully`,
      });
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const ApplicationUpdate = async (req, res) => {
  try {
    const type = req.body.applicationType;
    const validationSchema =
      type === "lead"
        ? LeadSchema
        : type === "basic"
        ? PersonalLoanBasicSchema
        : type === "address"
        ? PersonalLoanAddressSchema
        : type === "work"
        ? PersonalLoanWorkSchema
        : type === "document"
        ? PersonalLoanDocumentSchema
        : type === "account"
        ? PersonalLoanAccountSchema
        : type === "status"
        ? ApplicationStatusSchema
        : "";
    let validateData = await validationSchema.validate(req.body);
    if (validateData) {
      const findLoanApplication = await Loan.findOne({
        _id: new mongoose.Types.ObjectId(validateData._id),
      });
      if (validateData.status === LoanApplicationStepsEnum.DISBURSED) {
        validateData = {
          ...validateData,
          loanAmount: findLoanApplication.loanAmount,
          loanTenure: findLoanApplication.loanTenure,
        };
      }

      const data =
        type === "lead"
          ? await LeadData(validateData)
          : type === "basic"
          ? await BasicData({ ...validateData, operationBy: req.user._id })
          : type === "address"
          ? await AddressData(validateData)
          : type === "work"
          ? await WorkData(validateData)
          : type === "document"
          ? {
              applicationStaus: LoanStatusEnum.INCOMPLETED,
              activeIndex: 3,
              status: LoanApplicationStepsEnum.INCOMPLETED,
            }
          : type === "account"
          ? await AccountData({
              ...validateData,
              branch: findLoanApplication.branch,
            })
          : type === "status"
          ? await StatusData({ ...validateData, user: req.user._id })
          : "";

      const updateData = await Loan.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(validateData._id) },
        { $set: { ...data, updatedBy: req.user._id } }
      );
      if (updateData && (type === "status" || type === "account")) {
        let assignAgent = "";
        if (type === "account") {
          const selectEmployee = await LoanDivide(
            Position.VD,
            findLoanApplication.branch
          );
          if (selectEmployee) {
            assignAgent = selectEmployee;
          }
        }

        if (type === "status") {
          if (data.status === LoanApplicationStepsEnum.DOCUMENT_VERIFICATION) {
            const selectEmployee = await LoanDivide(
              Position.BM,
              findLoanApplication.branch
            );
            if (selectEmployee) {
              assignAgent = selectEmployee;
            }
          }
          if (data.status === LoanApplicationStepsEnum.LOAN_APPROVED) {
            const selectEmployee = await LoanDivide(
              Position.FM,
              findLoanApplication.branch
            );
            if (selectEmployee) {
              assignAgent = selectEmployee;
            }
          }
        }

        if (assignAgent !== "") {
          await loanType.updateOne(
            { _id: new mongoose.Types.ObjectId(validateData._id) },
            {
              $set: {
                assignAgent: new mongoose.Types.ObjectId(assignAgent),
              },
            }
          );
        }
      }
      res.status(StatusCodes.OK).json({
        data: updateData,
        message: `${
          type === "lead" ? "Lead" : "Application"
        } updated successfully`,
      });
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const getLoanDetail = async (req, res, next) => {
  try {
    const id = req.params.id;
    const details = await Loan.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchDetails",
        },
      },
      {
        $unwind: {
          path: "$branchDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "loantypes",
          localField: "loanType",
          foreignField: "_id",
          as: "loanDetails",
        },
      },
      {
        $unwind: {
          path: "$loanDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    const baseUrl = req.protocol + "://" + req.get("host");

    if (details[0].document) {
      details[0].document = details[0].document.map((item) => {
        const entityKey = Object.keys(item)[1];
        item.entity = entityKey;
        if (item[entityKey] && item[entityKey].documentImage) {
          item[
            entityKey
          ].documentUrl = `${baseUrl}/uploads/loan_document/${item[entityKey].documentImage}`;
        }
        return item;
      });
    }

    res.status(StatusCodes.OK).json({
      data: details[0],
      message: `Data fetched successfully`,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const documentDelete = async (req, res, next) => {
  try {
    const deleteDocument = await Loan.updateOne(
      {
        _id: new mongoose.Types.ObjectId(req.body._id),
      },
      {
        $set: { updatedBy: req.user._id },
        $pull: {
          document: { _id: new mongoose.Types.ObjectId(req.body.documentId) },
        },
      }
    );
    if (deleteDocument) {
      const uploadPath = GLocalImage(
        req.body.doumentImage,
        process.env.LOAN_PATH
      );
      await fs.promises.unlink(uploadPath);
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const documentUpload = async (req, res, next) => {
  try {
    let reqData = req.body;
    let data = {
      documentType: reqData.documentType,
      documentNumber: reqData.documentNumber,
    };

    if (req.files) {
      const a = await LoanImageUpload("", req.files.documentImage);
      data = { ...data, documentImage: a };
    }
    await Loan.updateOne(
      { _id: new mongoose.Types.ObjectId(reqData._id) },
      {
        $set: { updatedBy: req.user._id },
        $push: {
          document: {
            _id: new mongoose.Types.ObjectId(),
            [reqData.entity]: data,
          },
        },
      }
    );

    res
      .status(StatusCodes.OK)
      .json({ message: "Application updated successfully" });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const documentUpdate = async (req, res, next) => {
  try {
    let reqData = req.body;
    let data = {
      documentType: reqData.documentType,
      documentImage: reqData.documentImage,
      documentNumber: reqData.documentNumber,
    };

    if (req.files) {
      const findDocument = await Loan.findOne({
        _id: new mongoose.Types.ObjectId(reqData._id),
        // "document._id": new mongoose.Types.ObjectId(reqData.documentId),
      });

      // if (findDocument) {
      const findDocumentImage = findDocument.document.find(
        (item) => item._id.toString() === reqData.documentId
      );
      const documentImagePath = findDocumentImage[reqData.entity].documentImage;

      const a = await LoanImageUpload(
        documentImagePath,
        req.files.documentImage
      );
      data = { ...data, documentImage: a };
    }

    const a = await Loan.updateOne(
      { "document._id": new mongoose.Types.ObjectId(reqData.documentId) },
      {
        $set: {
          [`document.$.${reqData.entity}.documentType`]: data.documentType,
          [`document.$.${reqData.entity}.documentImage`]: data.documentImage,
          [`document.$.${reqData.entity}.documentNumber`]: data.documentNumber,
          updatedBy: req.user._id,
        },
      }
    );

    res
      .status(StatusCodes.OK)
      .json({ message: "Application updated successfully" });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const applicationDelete = async (req, res) => {
  try {
    const findApplication = await Loan.findOne({
      _id: new mongoose.Types.ObjectId(req.body._id),
    });

    if (findApplication) {
      if (findApplication?.document.length > 0) {
        for (let index = 0; index < findApplication?.document.length; index++) {
          const element = findApplication?.document[index];
          const deleteKey = Object.keys(element)[1];
          const uploadPath = GLocalImage(
            element[deleteKey].documentImage,
            process.env.LOAN_PATH
          );
          await fs.promises.unlink(uploadPath);
        }
      }
      const deleteApplication = await Loan.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(req.body._id),
      });
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const getEMIDetails = async (req, res) => {
  try {
    const EMI = await EMICalculator({
      loanAmount: Number(req.body.loanAmount),
      interestRate: Number(req.body.interestRate),
      loanTenure: Number(req.body.loanTenure),
    });

    const disbursment = await DisbursmentCalculate({
      loanAmount: Number(req.body.loanAmount),
    });

    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: {
        loanAmount: Number(req.body.loanAmount),
        interestRate: Number(req.body.interestRate),
        loanTenure: Number(req.body.loanTenure),
        EMIMonthly: EMI.emi,
        emiSchedule: EMI.emiSchedule,
        disbursment: disbursment,
      },
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const datatable = async (req, res, next) => {
  try {
    const reqData = req.body;
    const page = Number(reqData.page);
    const limit = Number(reqData.limit);
    const start = page * limit - limit;
    const query = [{ applicationStaus: reqData.applicationStaus }];
    const postion = req.user.position;
    if (reqData?.name) {
      query.push(BuildRegexQuery("name", reqData.name));
    }
    if (reqData?.applicationNumber) {
      query.push(
        BuildRegexQuery("applicationNumber", reqData.applicationNumber)
      );
    }
    if (reqData?.mobile) {
      query.push(BuildRegexQuery("mobile", reqData.mobile));
    }
    if (reqData?.loanType) {
      query.push({ loanType: new mongoose.Types.ObjectId(reqData.loanType) });
    }
    if (reqData?.branch) {
      query.push({ branch: new mongoose.Types.ObjectId(reqData.branch) });
    }

    if (postion === Position.LD) {
      query.push({
        assignAgent: new mongoose.Types.ObjectId(req.user._id),
      });
    }

    const positionList = PositionWiseData(req.user);

    const findQuery = [
      {
        $match: { $and: query },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchDetails",
        },
      },
      {
        $unwind: {
          path: "$branchDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: positionList.length > 0 ? { $and: positionList } : {},
      },
      {
        $lookup: {
          from: "loantypes",
          localField: "loanType",
          foreignField: "_id",
          as: "loanDetails",
        },
      },
      {
        $unwind: {
          path: "$loanDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "assignAgent",
          foreignField: "_id",
          as: "assignAgent",
        },
      },
      {
        $unwind: {
          path: "$assignAgent",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const countData = await Loan.aggregate([
      ...findQuery,
      { $count: "totalCount" },
    ]);
    const totalCount = countData.length > 0 ? countData[0].totalCount : 0;

    const data = await Loan.aggregate([
      ...findQuery,
      {
        $sort: reqData.sort || { createdAt: 1 },
      },
      { $skip: start },
      { $limit: limit },
    ]);

    return res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      // data: await Promise.all(
      //   data.map(async (item) => ({
      //     ...item,
      //     assignAgent: item.assignAgent
      //       ? await DataWithEmployeeName(item.assignAgent)
      //       : "",
      //   }))
      // ),
      data: data,

      count: totalCount,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const LeadBulkUpload = async (req, res, next) => {
  try {
    const reqData = req.body.data;

    const branchList = await branch.find({ isActive: true });

    const errorData = reqData.filter(
      (item1) => !branchList.some((item2) => item1.branch === item2.code)
    );

    if (errorData.length === 0) {
      const prepareData = [];
      for (let index = 0; index < reqData.length; index++) {
        const element = reqData[index];
        const findLoanDetails = await loanType.findOne({
          _id: new mongoose.Types.ObjectId(element.loanType._id),
        });
        for (let i = 0; i < branchList.length; i++) {
          const branch = branchList[i];
          if (element.branch === branch.code) {
            const leadModifyData = LeadData({
              ...element,
              loanType: element.loanType._id,
              branch: branch._id,
            });

            prepareData.push({
              _id: new mongoose.Types.ObjectId(),
              ...leadModifyData,
              loanAmount: leadModifyData.loanAmount
                ? Number(leadModifyData.loanAmount)
                : 28000,
              loanTenure: Number(leadModifyData.loanTenure),
              applicationNumber: `L-${GenerateApplicationNumber(
                findLoanDetails.entity
              )}`,
              createdBy: req.user._id,
            });
          }
        }
      }

      const updateLead = await Loan.insertMany(prepareData);

      if (updateLead) {
        for (let index = 0; index < prepareData.length; index++) {
          const element = prepareData[index];
          const selectEmployee = await LoanDivide(Position.LD, element.branch);
          if (selectEmployee) {
            await Loan.updateOne(
              { _id: new mongoose.Types.ObjectId(element._id) },
              {
                $set: {
                  assignAgent: new mongoose.Types.ObjectId(selectEmployee),
                },
              }
            );
          }
        }
      }
      return res.status(200).json({ message: "Data inserted successfully" });
    } else {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Branch not found", data: errorData });
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const LeadAssignAgent = async (req, res, next) => {
  try {
    const reqData = req.body;
    if (reqData.type === "single") {
      const updateLead = await Loan.updateOne(
        { _id: new mongoose.Types.ObjectId(reqData.leadId[0].id) },
        {
          $set: {
            assignAgent: new mongoose.Types.ObjectId(reqData.agentId.id),
          },
        }
      );

      if (updateLead) {
        const findEmployee = await employee.findOne({
          _id: new mongoose.Types.ObjectId(reqData.agentId.id),
        });
        if (findEmployee) {
          await employee.updateOne(
            { _id: new mongoose.Types.ObjectId(reqData.agentId.id) },
            {
              $set: {
                assignedLoansCount: findEmployee.assignedLoansCount + 1,
              },
            }
          );
        }
      }
    } else {
      for (let index = 0; index < reqData.leadId.length; index++) {
        const lead = reqData.leadId[index];

        if (lead.branchId.toString() === reqData.agentId.branchId.toString()) {
          await Loan.updateOne(
            { _id: new mongoose.Types.ObjectId(lead.id) },
            {
              $set: {
                assignAgent: new mongoose.Types.ObjectId(reqData.agentId.id),
              },
            }
          );
        }
      }
    }
    return res
      .status(StatusCodes.OK)
      .json({ message: "Lead assign sucessfully" });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

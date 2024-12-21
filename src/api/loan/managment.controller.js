import { StatusCodes } from "http-status-codes";

import mongoose from "mongoose";
import Loan from "./loan.model.js";
import employee from "../employess/employee.model.js";
import { BuildRegexQuery } from "../../utilis/utilis.js";
import {
  CityName,
  CountryName,
  DataWithEmployeeName,
  FormatType,
  StateName,
} from "./loan.config.js";
import documentType from "../document/documentType.model.js";
import document from "../document/document.model.js";
import { Position, PositionWiseData } from "../employess/EmployeeConfig.js";

export const LoanManagList = async (req, res) => {
  try {
    const position = req.user;
    let reqData = req.body;
    const page = Number(req.body.page);
    const limit = Number(req.body.limit);
    const start = page * limit - limit;
    const searchQuery = [
      {
        isLoanActive:
          reqData.applicationStaus === "activeLoan" ||
          reqData.applicationStaus === "delinquentLoan"
            ? true
            : false,
      },
    ];
    if (reqData?.name) {
      searchQuery.push(BuildRegexQuery("name", reqData.name));
    }
    if (reqData?.applicationNumber) {
      searchQuery.push(
        BuildRegexQuery("applicationNumber", reqData.applicationNumber)
      );
    }
    if (reqData?.mobile) {
      searchQuery.push(BuildRegexQuery("mobile", reqData.mobile));
    }
    if (reqData?.loanType) {
      searchQuery.push({
        loanType: new mongoose.Types.ObjectId(reqData.loanType),
      });
    }
    if (reqData?.branch) {
      searchQuery.push({ branch: new mongoose.Types.ObjectId(reqData.branch) });
    }
    const positionList = PositionWiseData(req.user);
    const query = [
      { $match: { $and: searchQuery } },
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
        $addFields: {
          paidEmi: {
            $size: {
              $filter: {
                input: "$emiSchedule",
                as: "emi",
                cond: { $eq: ["$$emi.isPaid", true] },
              },
            },
          },
          unpaidEmi: {
            $size: {
              $filter: {
                input: "$emiSchedule",
                as: "emi",
                cond: { $eq: ["$$emi.isPaid", false] },
              },
            },
          },
          overDueEmi: {
            $size: {
              $filter: {
                input: "$emiSchedule",
                as: "emi",
                cond: {
                  $and: [
                    { $eq: ["$$emi.isPaid", false] },
                    { $lt: ["$$emi.emiDate", new Date()] },
                  ],
                },
              },
            },
          },
        },
      },

      {
        $lookup: {
          from: "employees",
          localField: "assignAgent",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $unwind: {
          path: "$employeeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          applicationNumber: 1,
          loanAmount: 1,
          paidEmi: 1,
          unpaidEmi: 1,
          overDueEmi: 1,
          emiDetails: "$emiSchedule",
          branchDetails: 1,
          mobile: 1,
          name: 1,
          EMIMonthly: 1,
          loanType: 1,
          assignAgent: "$employeeDetails.username",
          agentRemark: 1,
        },
      },
    ];
    const countData = await Loan.aggregate([
      ...query,
      {
        $count: "count",
      },
    ]);

    const data = await Loan.aggregate([
      ...query,
      {
        $sort: reqData.sort || { createdAt: 1 },
      },
      { $skip: start },
      { $limit: limit },
    ]);

    let modifyCount = countData.length > 0 ? countData[0].count : 0;
    let modifyData = data;
    if (reqData.applicationStaus === "delinquentLoan") {
      const filterData = data.filter((item) => item.overDueEmi !== 0);
      modifyCount = filterData.length;
      modifyData = filterData;
    }

    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: modifyData,
      total: modifyCount,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const AgentList = async (req, res) => {
  try {
    const id = req.params.id;
    const position = req.user;

    const list = await employee.aggregate([
      { $match: { branch: new mongoose.Types.ObjectId(id), isActive: true } },
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
        $match: {
          "branchDetails.country": position?.country
            ? position?.country
            : { $ne: "" },
          "branchDetails.state": position.state ? position.state : { $ne: "" },
          "branchDetails.city": position.city ? position.city : { $ne: "" },
          "branchDetails.isActive": true,
        },
      },
    ]);

    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: list,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const AddRemarkAgent = async (req, res) => {
  try {
    const reqData = req.body;
    if (reqData.type === "agent") {
      await Loan.updateOne(
        { _id: new mongoose.Types.ObjectId(reqData.loanId) },
        {
          $set: {
            assignAgent: new mongoose.Types.ObjectId(reqData.assignAgent),
            updatedBy: new mongoose.Types.ObjectId(req.user._id),
          },
        }
      );
    } else {
      await Loan.updateOne(
        { _id: new mongoose.Types.ObjectId(reqData.loanId) },
        {
          $push: {
            agentRemark: {
              _id: new mongoose.Types.ObjectId(),
              createdBy: new mongoose.Types.ObjectId(req.user._id),
              updatedBy: null,
              date: new Date(),
              remark: reqData.agentRemark,
            },
          },
          $set: {
            updatedBy: req.user._id,
          },
        }
      );
    }

    res.status(StatusCodes.OK).json({
      message: `${
        reqData.type === "agent" ? "Agent assign " : "Remark add"
      } successfully`,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const RemarkDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Loan.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $project: {
          agentRemark: 1,
          loanId: "$_id",
          _id: 0,
        },
      },
      {
        $unwind: {
          path: "$agentRemark",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "employees",
          localField: "agentRemark.createdBy",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $unwind: {
          path: "$employeeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          loanId: 1,
          id: "$agentRemark._id",
          updatedBy: "$agentRemark.updatedBy",
          date: "$agentRemark.date",
          remark: "$agentRemark.remark",
          createdBy_name: "$employeeDetails.name",
          createdBy_username: "$employeeDetails.username",
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
    ]);
    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: data,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const PaymentDetails = async (req, res) => {
  try {
    const position = req.user;
    const query = [{ "emiSchedule.isPaid": false }];
    if (req.body.startDate && req.body.endDate) {
      query.push({
        "emiSchedule.emiDate": {
          $gte: new Date(req.body.startDate),
          $lte: new Date(req.body.endDate),
        },
      });
    }
    const details = await Loan.aggregate([
      {
        $match: req.body.loanId
          ? {
              _id: new mongoose.Types.ObjectId(req.body.loanId),
            }
          : {},
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
        $match: {
          "branchDetails.country": position?.country
            ? position?.country
            : { $ne: "" },
          "branchDetails.state": position.state ? position.state : { $ne: "" },
          "branchDetails.city": position.city ? position.city : { $ne: "" },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "assignAgent",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $unwind: {
          path: "$employeeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          emiSchedule: 1,
          loanId: "$_id",
          _id: 0,
          loanCharges: 1,
          applicationNumber: "$applicationNumber",
          loanAmount: "$loanAmount",
          mobile: "$mobile",
          isLoanActive: "$isLoanActive",
          name: "$name",
          branchName: "$branchDetails.name",
          branchCode: "$branchDetails.code",
          branchId: "$branchDetails._id",
          agentRemark: "$agentRemark",
          assignAgentUsername: "$employeeDetails.username",
        },
      },
      {
        $unwind: {
          path: "$emiSchedule",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $and: query,
        },
      },
      {
        $addFields: {
          today: {
            $dateFromParts: {
              year: { $year: "$$NOW" },
              month: { $month: "$$NOW" },
              day: { $dayOfMonth: "$$NOW" },
            },
          },
        },
      },
      {
        $addFields: {
          overdueDays: {
            $cond: {
              if: {
                $and: [
                  {
                    $eq: ["$emiSchedule.isPaid", false],
                  },
                  {
                    $lt: ["$emiSchedule.emiDate", "$$NOW"],
                  },
                ],
              },
              then: {
                $dateDiff: {
                  startDate: "$emiSchedule.emiDate",
                  endDate: "$$NOW",
                  unit: "day",
                },
              },
              else: 0,
            },
          },
        },
      },
      {
        $lookup: {
          from: "charges",
          localField: "loanCharges",
          foreignField: "_id",
          as: "charges",
        },
      },
      {
        $unwind: {
          path: "$charges",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          overdueAmount: {
            $cond: {
              if: {
                $and: [
                  {
                    $eq: ["$emiSchedule.isPaid", false],
                  },
                  {
                    $lt: ["$emiSchedule.emiDate", "$$NOW"],
                  },
                ],
              },
              then: {
                $multiply: [
                  {
                    $multiply: [
                      {
                        $toDouble: "$emiSchedule.emiAmount",
                      },
                      {
                        $divide: [
                          {
                            $toDouble: "$charges.overdue",
                          },
                          100,
                        ],
                      },
                    ],
                  },
                  "$overdueDays",
                ],
              },
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          payableAmount: {
            $add: [
              { $toDouble: "$emiSchedule.emiAmount" },
              { $toDouble: "$overdueAmount" },
            ],
          },
        },
      },

      {
        $project: {
          loanId: 1,
          _id: "$emiSchedule._id",
          emiDate: "$emiSchedule.emiDate",
          emiAmount: "$emiSchedule.emiAmount",
          interestPaid: "$emiSchedule.interestPaid",
          principalPaid: "$emiSchedule.principalPaid",
          isPaid: "$emiSchedule.isPaid",
          remainingOutstanding: "$emiSchedule.remainingOutstanding",
          foreclosureAmount: "$emiSchedule.foreclosureAmount",
          overdueDays: 1,
          overdueAmount: 1,
          payableAmount: 1,
          applicationNumber: 1,
          loanAmount: 1,
          mobile: 1,
          isLoanActive: 1,
          name: 1,
          branchName: 1,
          branchCode: 1,
          branchId: 1,
          agentRemark: 1,
          assignAgentUsername: 1,
        },
      },
      {
        $sort: {
          isPaid: 1,
        },
      },
    ]);

    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: details,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const LoanPay = async (req, res) => {
  try {
    const reqData = req.body;
    const findLoan = await Loan.findOne({
      _id: new mongoose.Types.ObjectId(reqData.loanId),
    });

    if (findLoan) {
      const prepareData =
        reqData.type === "emi_pay" || reqData.type === "emi_settlement"
          ? {
              "emiSchedule.$.payableAmount": Number(reqData.amount),
              "emiSchedule.$.waiverAmount": Number(reqData.waiverAmount),
              "emiSchedule.$.isPaid": true,
              "emiSchedule.$.loanPayType": reqData.type,
              "emiSchedule.$.overdueAmount": Number(reqData.overdueAmount),
              "emiSchedule.$.overdueDays": Number(reqData.overdueDays),
              "emiSchedule.$.transactionNumber": reqData.transactionNumber,
              "emiSchedule.$.paidOn": new Date(),
              "emiSchedule.$.updatedBy": new mongoose.Types.ObjectId(
                req.user._id
              ),
            }
          : reqData.type === "foreclosure" || reqData.type === "loan_settlement"
          ? {
              "emiSchedule.$[].payableAmount":
                Number(reqData.amount) / findLoan.emiSchedule.length,
              "emiSchedule.$[].waiverAmount":
                Number(reqData.waiverAmount) / findLoan.emiSchedule.length,
              "emiSchedule.$[].isPaid": true,
              "emiSchedule.$[].paidOn": new Date(),
              "emiSchedule.$[].loanPayType": reqData.type,
              "emiSchedule.$[].waiverAmount": Number(reqData.waiverAmount),
              "emiSchedule.$[].transactionNumber": reqData.transactionNumber,
              "emiSchedule.$[].updatedBy": new mongoose.Types.ObjectId(
                req.user._id
              ),
              isLoanActive: false,
              updatedBy: new mongoose.Types.ObjectId(req.user._id),
            }
          : {};

      await Loan.updateOne(
        {
          _id: new mongoose.Types.ObjectId(reqData.loanId),
          "emiSchedule._id": new mongoose.Types.ObjectId(reqData._id),
        },
        {
          $set: { ...prepareData },
        }
      );

      return res
        .status(StatusCodes.OK)
        .json({ message: "Loan payment successfully" });
    } else {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Loan details not available" });
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const PaidLoanList = async (req, res) => {
  try {
    const position = req.user;
    const query = [{ "emiSchedule.isPaid": true }];
    if (req.body.startDate && req.body.endDate) {
      query.push({
        "emiSchedule.emiDate": {
          $gte: new Date(req.body.startDate),
          $lte: new Date(req.body.endDate),
        },
      });
    }
    const findLoan = await Loan.aggregate([
      {
        $match: req.body.loanId
          ? {
              _id: new mongoose.Types.ObjectId(req.body.loanId),
            }
          : {},
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
        $match: {
          "branchDetails.country": position?.country
            ? position?.country
            : { $ne: "" },
          "branchDetails.state": position.state ? position.state : { $ne: "" },
          "branchDetails.city": position.city ? position.city : { $ne: "" },
        },
      },
      {
        $project: {
          emiSchedule: 1,
          loanId: "$_id",
          _id: 0,
          applicationNumber: "$applicationNumber",
          loanAmount: "$loanAmount",
          mobile: "$mobile",
          isLoanActive: "$isLoanActive",
          name: "$name",
          branchName: "$branchDetails.name",
          branchCode: "$branchDetails.code",
        },
      },
      {
        $unwind: {
          path: "$emiSchedule",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $and: query,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            loanId: "$loanId",
            applicationNumber: "$applicationNumber",
            loanAmount: "$loanAmount",
            mobile: "$mobile",
            isLoanActive: "$isLoanActive",
            name: "$name",
            emiDate: "$emiSchedule.emiDate",
            emiAmount: "$emiSchedule.emiAmount",
            interestPaid: "$emiSchedule.interestPaid",
            principalPaid: "$emiSchedule.principalPaid",
            isPaid: "$emiSchedule.isPaid",
            remainingOutstanding: "$emiSchedule.remainingOutstanding",
            foreclosureAmount: "$emiSchedule.foreclosureAmount",
            loanPayType: "$emiSchedule.loanPayType",
            overdueAmount: "$emiSchedule.overdueAmount",
            overdueDays: "$emiSchedule.overdueDays",
            payableAmount: "$emiSchedule.payableAmount",
            transactionNumber: "$emiSchedule.transactionNumber",
            updatedBy: "$emiSchedule.updatedBy",
            waiverAmount: "$emiSchedule.waiverAmount",
            branchName: "$branchName",
            branchCode: "$branchCode",
          },
        },
      },
      {
        $sort: {
          emiDate: 1,
        },
      },
    ]);
    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: findLoan,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const ApplicationView = async (req, res) => {
  try {
    const id = req.params.id;
    const loanDetails = await Loan.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "loantypes",
          localField: "loanType",
          foreignField: "_id",
          as: "loanType",
        },
      },
      {
        $unwind: {
          path: "$loanType",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: {
          path: "$branch",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "charges",
          localField: "loanCharges",
          foreignField: "_id",
          as: "loanCharges",
        },
      },
      {
        $unwind: {
          path: "$loanCharges",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    const a = loanDetails[0];

    const modifyDocument = a.document.map((item) => {
      const key = Object.keys(item).find((k) => k !== "_id");
      const doc = item[key];
      return {
        type: FormatType(key),
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
      };
    });
    const documentFullList = await document.find({});
    const documentNameList = modifyDocument.map((item) => {
      const matchedDocument = documentFullList.find(
        (element) => item.documentType === element._id.toString()
      );

      if (matchedDocument) {
        return { ...item, documentType: matchedDocument.documentName };
      }
      return item;
    });
    console.log(a.documentVerifiedBy);
    const prepareData = {
      ...a,
      createdBy: await DataWithEmployeeName(a.createdBy),
      loanAllotAgent: a?.loanAllotAgent
        ? DataWithEmployeeName(a.loanAllotAgent)
        : null,
      updatedBy: a.updatedBy ? await DataWithEmployeeName(a.updatedBy) : null,
      disbursedBy: await DataWithEmployeeName(a.disbursedBy),
      loanVerifiedBy: a?.loanVerifiedBy
        ? await DataWithEmployeeName(a.loanVerifiedBy)
        : null,
      addressVerifiedBy: a?.addressVerifiedBy
        ? await DataWithEmployeeName(a.addressVerifiedBy)
        : null,
      officeOrBussinessVerifiedBy: a?.officeOrBussinessVerifiedBy
        ? await DataWithEmployeeName(a.officeOrBussinessVerifiedBy)
        : null,
      documentVerifiedBy: a?.documentVerifiedBy
        ? await DataWithEmployeeName(a.documentVerifiedBy)
        : null,
      document: documentNameList,
      permanentCountry: a.permanentCountry
        ? await CountryName(a.permanentCountry)
        : null,
      permanentState: a.permanentState
        ? await StateName(a.permanentState)
        : null,
      permanentCity: a.permanentCity ? await CityName(a.permanentCity) : null,

      residenceCountry: a.residenceCountry
        ? await CountryName(a.residenceCountry)
        : null,
      residenceState: a.residenceState
        ? await StateName(a.residenceState)
        : null,
      residenceCity: a.residenceCity ? await CityName(a.residenceCity) : null,

      workCountry: a.workCountry ? await CountryName(a.workCountry) : null,
      workState: a.workState ? await StateName(a.workState) : null,
      workCity: a.workCity ? await CityName(a.workCity) : null,
    };

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: prepareData });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

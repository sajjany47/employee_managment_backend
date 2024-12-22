import { StatusCodes } from "http-status-codes";
import finance from "./finance.model.js";
import { DataManage, GeneratePayout } from "./FinanceData.js";
import mongoose from "mongoose";
import { BuildRegexQuery } from "../../utilis/utilis.js";
import {
  financeSchema,
  payNowSchema,
  reedemApplySchema,
} from "./finance.schema.js";
import {
  InvestmentList,
  PayoutFrequencies,
  PayoutFrequenciesList,
} from "./Finance.Config.js";
import moment from "moment";
import { DataWithEmployeeName } from "../loan/loan.config.js";
import ExcelJS from "exceljs";
import { PositionWiseData } from "../employess/EmployeeConfig.js";

export const financeCreate = async (req, res) => {
  try {
    const validData = await financeSchema.validate(req.body);
    if (validData) {
      const prepareData = DataManage(validData);
      const data = new finance({
        ...prepareData,
        createdBy: req.user._id,
        initialCapital: Number(prepareData.investmentAmount),
        planDetails: [
          {
            _id: new mongoose.Types.ObjectId(),
            investmentType: prepareData.investmentType,
            investmentAmount: Number(prepareData.investmentAmount),
            duration: Number(prepareData.duration),
            interestRate: Number(prepareData.interestRate),
            payoutFrequency: prepareData.payoutFrequency,
            payoutDate: new Date(prepareData.payoutDate),
            updatedAt: new Date(),
            updatedBy: new mongoose.Types.ObjectId(req.user._id),
          },
        ],
        payoutReedem: [],
      });
      await data.save();

      return res
        .status(StatusCodes.OK)
        .json({ message: "Investor added successfully" });
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const financeUpdate = async (req, res) => {
  try {
    const validData = await financeSchema.validate(req.body);
    if (validData) {
      const findInvestor = await finance.findOne({
        _id: new mongoose.Types.ObjectId(validData._id),
      });
      if (findInvestor) {
        const filterPayout = findInvestor.payoutSchedule.filter(
          (item) => item.isPaid === true
        );
        let data = DataManage(validData);

        if (
          Number(data.interestRate) !== Number(findInvestor.interestRate) ||
          Number(data.duration) !== Number(findInvestor.duration) ||
          data.payoutFrequency !== findInvestor.payoutFrequency ||
          moment(data.payoutDate).format("YYYY-MM-DD") !==
            moment(findInvestor.payoutDate).format("YYYY-MM-DD") ||
          data.investmentType !== findInvestor.investmentType ||
          Number(data.investmentAmount) !==
            Number(findInvestor.investmentAmount)
        ) {
          data.isMaturityCompleted = false;

          data.planDetails = [
            ...findInvestor.planDetails,
            {
              _id: new mongoose.Types.ObjectId(),
              investmentType: data.investmentType,
              investmentAmount: Number(data.investmentAmount),
              duration: Number(data.duration),
              interestRate: Number(data.interestRate),
              payoutFrequency: data.payoutFrequency,
              payoutDate: new Date(data.payoutDate),
              updatedAt: new Date(),
              updatedBy: new mongoose.Types.ObjectId(req.user._id),
            },
          ];
          data.initialCapital = Number(data.investmentAmount);
        }
        await finance.updateOne(
          { _id: new mongoose.Types.ObjectId(validData._id) },
          {
            $set: {
              ...data,
              payoutSchedule: [...data.payoutSchedule, ...filterPayout],
              updatedBy: req.user._id,
            },
          }
        );
        return res
          .status(StatusCodes.OK)
          .json({ message: "Investor updated successfully" });
      } else {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "Investor not founded" });
      }
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const financeGetDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await finance.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
    ]);
    const findData = data[0];
    const modifyData = {
      ...findData,
      createdBy: await DataWithEmployeeName(findData.createdBy),
      updatedBy: await DataWithEmployeeName(findData.updatedBy),
      planDetails: await Promise.all(
        findData?.planDetails.map(async (item) => ({
          ...item,
          updatedBy: await DataWithEmployeeName(item.updatedBy),
        }))
      ),
      payoutSchedule: await Promise.all(
        findData?.payoutSchedule.map(async (item) => ({
          ...item,
          paidBy: item.isPaid ? await DataWithEmployeeName(item.paidBy) : null,
        }))
      ),
      payoutReedem: await Promise.all(
        findData?.payoutReedem.map(async (item) => ({
          ...item,
          paidBy: item.isPaid ? await DataWithEmployeeName(item.paidBy) : null,
          createdBy: await DataWithEmployeeName(item.createdBy),
        }))
      ),
    };
    return res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: modifyData });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const financePayNow = async (req, res) => {
  try {
    const validData = await payNowSchema.validate(req.body);
    if (validData) {
      const findInvestor = await finance.findOne({ _id: validData._id });
      if (findInvestor) {
        let reqData = {};
        if (validData.type === "payout") {
          reqData = {
            "payoutSchedule.$.isPaid": true,
            "payoutSchedule.$.transactionNumber": validData.transactionNumber,
            "payoutSchedule.$.paidBy": new mongoose.Types.ObjectId(
              req.user._id
            ),
            "payoutSchedule.$.paidOn": new Date(),
            updatedBy: new mongoose.Types.ObjectId(req.user._id),
          };

          const filterCurrentPayout = findInvestor.payoutSchedule.filter(
            (item) => item._id.toString() !== validData.payoutId
          );

          const filterPayout = filterCurrentPayout.filter(
            (item) => item.isPaid === false
          );
          if (filterPayout.length === 0) {
            reqData.isMaturityCompleted = true;
          } else {
            reqData.isMaturityCompleted = false;
            reqData.isInvestorActive = true;
          }
        }

        if (validData.type === "reedem") {
          reqData = {
            "payoutReedem.$.isPaid": true,
            "payoutReedem.$.transactionNumber": validData.transactionNumber,
            "payoutReedem.$.paidBy": new mongoose.Types.ObjectId(req.user._id),
            "payoutReedem.$.paidOn": new Date(),
            updatedBy: new mongoose.Types.ObjectId(req.user._id),
          };

          if (findInvestor.investmentAmount === 0) {
            reqData.isInvestorActive = false;
            reqData.isFullyPaid = true;
            reqData.transactionNumber = validData.transactionNumber;
            reqData.paidOn = new Date();
          }
        }

        if (validData.type === "matured") {
          reqData = {
            isInvestorActive: false,
            isFullyPaid: true,
            transactionNumber: validData.transactionNumber,
            paidOn: new Date(),
            updatedBy: new mongoose.Types.ObjectId(req.user._id),
          };
        }
        await finance.updateOne(
          validData.type === "payout"
            ? {
                "payoutSchedule._id": new mongoose.Types.ObjectId(
                  validData.payoutId
                ),
              }
            : validData.type === "reedem"
            ? {
                "payoutReedem._id": new mongoose.Types.ObjectId(
                  validData.reedemId
                ),
              }
            : { _id: new mongoose.Types.ObjectId(validData._id) },
          {
            $set: reqData,
          }
        );
        return res
          .status(StatusCodes.OK)
          .json({ message: "Payment updated successfully" });
      } else {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "Investor not found!" });
      }
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const financeReedemApply = async (req, res) => {
  try {
    const validData = await reedemApplySchema.validate(req.body);
    if (validData) {
      const findInvestor = await finance.findOne({
        _id: new mongoose.Types.ObjectId(validData._id),
      });

      if (findInvestor) {
        const filterPayoutSchedule = findInvestor.payoutSchedule.filter(
          (item) => item.isPaid === true
        );
        const payoutSchedule =
          validData.remainingInvestAmount === "0"
            ? []
            : GeneratePayout({
                investmentAmount: validData.remainingInvestAmount,
                duration: validData.duration,
                interestRate: validData.interestRate,
                payoutFrequency:
                  validData.payoutFrequency === PayoutFrequencies.MONTHLY
                    ? 1
                    : validData.payoutFrequency === PayoutFrequencies.QUARTERLY
                    ? 3
                    : validData.payoutFrequency ===
                      PayoutFrequencies.SEMI_ANNUALLY
                    ? 6
                    : validData.payoutFrequency === PayoutFrequencies.ANNUALLY
                    ? 12
                    : validData.payoutFrequency ===
                      PayoutFrequencies.AT_MATURITY
                    ? Number(validData.duration)
                    : 1,
                payoutDate: validData.payoutDate,
              });
        await finance.updateOne(
          { _id: new mongoose.Types.ObjectId(validData._id) },
          {
            $push: {
              payoutReedem: {
                _id: new mongoose.Types.ObjectId(),
                reedemAmount: Number(validData.reedemAmount),
                reedemDate: new Date(validData.reedemDate),
                remainingInvestAmount: Number(validData.remainingInvestAmount),
                isPaid: false,
                paidOn: null,
                transactionNumber: null,
                createdBy: new mongoose.Types.ObjectId(req.user._id),
                createdOn: new Date(),
              },
            },
            $set: {
              investmentAmount: validData.remainingInvestAmount,
              duration:
                Number(validData.remainingInvestAmount) === 0
                  ? null
                  : validData.duration,
              interestRate:
                Number(validData.remainingInvestAmount) === 0
                  ? null
                  : validData.interestRate,
              payoutFrequency:
                Number(validData.remainingInvestAmount) === 0
                  ? null
                  : validData.payoutFrequency,
              payoutDate:
                Number(validData.remainingInvestAmount) === 0
                  ? null
                  : new Date(validData.payoutDate),

              updatedBy: new mongoose.Types.ObjectId(req.user._id),
              payoutSchedule: [...filterPayoutSchedule, ...payoutSchedule],
            },
          }
        );

        return res
          .status(StatusCodes.OK)
          .json({ message: "Reedem apply successfully" });
      } else {
        res
          .status(StatusCodes.NON_AUTHORITATIVE_INFORMATION)
          .json({ message: "Investor not found!" });
      }
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const InvestorDatatable = async (req, res) => {
  try {
    const reqData = req.body;
    const page = reqData.page;
    const limit = reqData.limit;
    const start = page * limit - limit;
    const query = [];
    if (reqData.name) {
      query.push(BuildRegexQuery("name", reqData.name));
    }
    if (reqData.mobile) {
      query.push(BuildRegexQuery("mobile", reqData.mobile));
    }
    if (reqData.email) {
      query.push(BuildRegexQuery("email", reqData.email));
    }
    if (reqData.investmentType) {
      query.push({ investmentType: reqData.investmentType });
    }
    if (reqData.payoutFrequency) {
      query.push({ payoutFrequency: reqData.payoutFrequency });
    }
    if (reqData.hasOwnProperty("isInvestorActive")) {
      query.push({
        isInvestorActive: reqData.isInvestorActive,
      });
    }
    const positionList = PositionWiseData(req.user);

    const data = await finance.aggregate([
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
          ...(positionList.length > 0 && { $and: positionList }),
          ...(query.length > 0 && { $and: query }),
        },
      },
      {
        $facet: {
          count: [{ $count: "total" }],
          data: [
            {
              $sort: reqData.sort || { name: 1 },
            },
            { $skip: start },
            { $limit: limit },
          ],
        },
      },
    ]);

    return res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: data[0].data,
      count: data[0].count[0] ? data[0].count[0].total : 0,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const PayoutDatable = async (req, res) => {
  try {
    const reqData = req.body;
    const page = reqData.page;
    const limit = reqData.limit;
    const start = page * limit - limit;
    const query = [
      { "payoutSchedule.isPaid": false },
      {
        "payoutSchedule.payoutDate": {
          $gte: new Date(req.body.startDate),
          $lte: new Date(req.body.endDate),
        },
      },
    ];

    if (reqData.name) {
      query.push(BuildRegexQuery("name", reqData.name));
    }
    if (reqData.mobile) {
      query.push(BuildRegexQuery("mobile", reqData.mobile));
    }
    if (reqData.investmentType) {
      query.push({ investmentType: reqData.investmentType });
    }
    if (reqData.payoutFrequency) {
      query.push({ payoutFrequency: reqData.payoutFrequency });
    }

    const positionList = PositionWiseData(req.user);

    const findQuery = [
      {
        $unwind: {
          path: "$payoutSchedule",
          preserveNullAndEmptyArrays: true,
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
        $match: {
          ...(positionList.length > 0 && { $and: positionList }),
          ...(query.length > 0 && { $and: query }),
        },
      },
    ];

    const countData = await finance.aggregate([
      ...findQuery,
      {
        $count: "count",
      },
    ]);

    const data = await finance.aggregate([
      ...findQuery,
      {
        $sort: reqData.sort || { name: 1 },
      },

      { $skip: start },
      { $limit: limit },
    ]);

    return res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: data,
      count: countData.length > 0 ? countData[0].count : 0,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const ReedemDatable = async (req, res) => {
  try {
    const reqData = req.body;
    const page = reqData.page;
    const limit = reqData.limit;
    const start = page * limit - limit;
    const query = [
      { "payoutReedem.isPaid": false },
      {
        "payoutReedem.reedemDate": {
          $gte: new Date(req.body.startDate),
          $lte: new Date(req.body.endDate),
        },
      },
    ];

    if (reqData.name) {
      query.push(BuildRegexQuery("name", reqData.name));
    }

    const positionList = PositionWiseData(req.user);

    const findQuery = [
      {
        $unwind: {
          path: "$payoutReedem",
          preserveNullAndEmptyArrays: true,
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
        $match: {
          ...(positionList.length > 0 && { $and: positionList }),
          ...(query.length > 0 && { $and: query }),
        },
      },
    ];
    const countData = await finance.aggregate([
      ...findQuery,
      {
        $count: "count",
      },
    ]);

    const data = await finance.aggregate([
      ...findQuery,
      {
        $sort: reqData.sort || { name: 1 },
      },

      { $skip: start },
      { $limit: limit },
    ]);

    return res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: data,
      count: countData.length > 0 ? countData[0].count : 0,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const MaturedDatatable = async (req, res) => {
  try {
    const reqData = req.body;
    const page = reqData.page;
    const limit = reqData.limit;
    const start = page * limit - limit;
    const query = [
      { isMaturityCompleted: true },
      {
        isFullyPaid: false,
      },
    ];

    if (reqData.name) {
      query.push(BuildRegexQuery("name", reqData.name));
    }
    if (reqData.mobile) {
      query.push(BuildRegexQuery("mobile", reqData.mobile));
    }
    if (reqData.investmentType) {
      query.push({ investmentType: reqData.investmentType });
    }
    if (reqData.payoutFrequency) {
      query.push({ payoutFrequency: reqData.payoutFrequency });
    }
    const positionList = PositionWiseData(req.user);
    const positionQuery = [
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
    ];

    const countData = await finance.aggregate([
      ...positionQuery,
      { $match: query.length > 0 ? { $and: query } : {} },
      {
        $count: "count",
      },
    ]);

    const data = await finance.aggregate([
      ...positionQuery,
      { $match: query.length > 0 ? { $and: query } : {} },
      {
        $sort: reqData.sort || { name: 1 },
      },

      { $skip: start },
      { $limit: limit },
    ]);

    return res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: data,
      count: countData.length > 0 ? countData[0].count : 0,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const downloadInvestorExcelFile = async (req, res, next) => {
  try {
    const headers = [
      "Name",
      "Mobile",
      "Email",
      "DOB",
      "Aadhar Number",
      "Pan Number",
      "Investment Type",
      "Investment Amount",
      "Duration (In months)",
      "Interest Rate/Month",
      "Payout Frequency",
      "Payout Date",
      "IFSC Code",
      "Bank Name",
      "Branch Name",
      "Account Number",
      "Account Name",
    ];

    const investmentArray = InvestmentList.map((item) => item.label);
    const payoutArray = PayoutFrequenciesList.map((item) => item.label);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC000" }, // Background color (gold)
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" }, // Font color (white)
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    worksheet.columns = headers.map(() => ({ width: 25 }));
    worksheet.dataValidations.add("G1:G1048576", {
      type: "list",
      allowBlank: false,
      formulae: [`"${investmentArray.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Invalid Input",
      error: "Please select a valid investment type from the dropdown.",
    });
    worksheet.dataValidations.add("K1:K1048576", {
      type: "list",
      allowBlank: false,
      formulae: [`"${payoutArray.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Invalid Input",
      error: "Please select a valid payout frequency from the dropdown.",
    });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "Investor.xlsx"
    );
    workbook.xlsx.write(res).then(() => res.end());
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const readInvestorExcelFile = async (req, res) => {
  try {
    const file = req.files;
    const excelFile = file.files;

    const workBook = new ExcelJS.Workbook();
    await workBook.xlsx.load(excelFile.data);
    const worksheet = workBook.worksheets[0];
    const headers = [];
    const rows = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers.push(cell.value);
        });
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value;
        });
        rows.push(rowData);
      }
    });

    const prepareData = rows.map((item) => {
      const filterInvestment = InvestmentList.find(
        (elm) => elm.label === item["Investment Type"]
      );

      const manageData = DataManage({
        name: item.Name,
        mobile: item.Mobile,
        email: item.Email.text,
        dob: moment(item.DOB, "DD-MM-YYYY").format(),
        investmentType: filterInvestment.value,
        investmentAmount: item["Investment Amount"],
        duration: item["Duration (In months)"],
        interestRate: item["Interest Rate/Month"],
        payoutFrequency: item["Payout Frequency"],
        payoutDate: moment(item["Payout Date"], "DD-MM-YYYY"),
        accountNumber: item["Account Number"],
        bankName: item["Bank Name"],
        bankBranchName: item["Branch Name"],
        ifsc: item["IFSC Code"],
        accountName: item["Account Name"],
        panNumber: item["Pan Number"].toUpperCase(),
        aadharNumber: item["Aadhar Number"],
      });

      return manageData;
    });
    // await finance.insertMany(prepareData);
    return res
      .status(200)
      .json({ message: "Investor uploaded successfully", data: prepareData });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const insertManyWithExcel = async (req, res) => {
  try {
    await finance.insertMany(req.body.data);
    res
      .status(200)
      .json({ message: "Investor uploaded successfully", data: req.body.data });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

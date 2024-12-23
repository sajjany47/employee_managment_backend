import { StatusCodes } from "http-status-codes";
import finance from "../Finance/finance.model.js";
import Loan from "../loan/loan.model.js";
import { MonthNameAdd } from "./report.config.js";
import moment from "moment";
import { PositionWiseData } from "../employess/EmployeeConfig.js";

export const financialReport = async (req, res) => {
  try {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    const positionList = PositionWiseData(req.user);
    const result = await finance.aggregate([
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
        $facet: {
          totalInvestor: [{ $count: "total" }],
          newInvestor: [
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $count: "total" },
          ],
          totalActiveInvestor: [
            { $match: { isInvestorActive: true } },
            { $count: "total" },
          ],
          totalInvestment: [
            {
              $group: {
                _id: null,
                totalInvestment: { $sum: "$initialCapital" },
              },
            },
          ],
          newInvestment: [
            {
              $match: { createdAt: { $gte: startDate, $lte: endDate } },
            },
            {
              $group: {
                _id: null,
                newInvestment: { $sum: "$initialCapital" },
              },
            },
          ],
          reedemAmount: [
            {
              $unwind: {
                path: "$payoutReedem",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                "payoutReedem.isPaid": true,
                "payoutReedem.createdOn": { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: null,
                reedemAmount: { $sum: "$payoutReedem.reedemAmount" },
              },
            },
          ],
          remainingInvestAmount: [
            { $match: { isInvestorActive: true } },
            {
              $group: {
                _id: null,
                remainingInvestAmount: { $sum: "$investmentAmount" },
              },
            },
          ],
          monthWiseInvestor: [
            {
              $match: { createdAt: { $gte: startDate, $lte: endDate } },
            },
            {
              $project: {
                monthYear: {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%B",
                        date: "$createdAt",
                      },
                    },
                    ",",
                    { $toString: { $year: "$createdAt" } },
                  ],
                },
                investAmount: "$initialCapital",
                investor: "$_id",
              },
            },
            {
              $group: {
                _id: "$monthYear",
                totalInvestAmount: { $sum: "$investAmount" },
                totalInvestors: { $addToSet: "$investor" },
              },
            },
            {
              $project: {
                _id: 1,
                totalInvestAmount: 1,
                totalInvestorCount: { $size: "$totalInvestors" },
              },
            },
            {
              $sort: {
                _id: 1,
              },
            },
          ],

          monthWiseReedem: [
            {
              $unwind: {
                path: "$payoutReedem",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                "payoutReedem.isPaid": true,
                "payoutReedem.createdOn": { $gte: startDate, $lte: endDate },
                "payoutReedem.isPaid": true,
              },
            },
            {
              $project: {
                monthYear: {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%B",
                        date: "$payoutReedem.reedemDate",
                      },
                    },
                    ", ",
                    {
                      $toString: {
                        $year: "$payoutReedem.reedemDate",
                      },
                    },
                  ],
                },
                reedemAmount: "$payoutReedem.reedemAmount",
              },
            },
            {
              $group: {
                _id: "$monthYear",
                totalReedemAmount: { $sum: "$reedemAmount" },
              },
            },
            {
              $sort: {
                _id: 1,
              },
            },
          ],
        },
      },
    ]);

    const data = result[0];

    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: {
        investor: {
          totalInvestor: data.totalInvestor[0]?.total || "",
          newInvestor: data.newInvestor[0]?.total || "",
          totalActiveInvestor: data.totalActiveInvestor[0]?.total || "",
        },

        investment: {
          totalInvestment: data.totalInvestment[0]?.totalInvestment || "",
          newInvestment: data.newInvestment[0]?.newInvestment || "",
          reedemAmount: data.reedemAmount[0]?.reedemAmount || "",
          remainingInvestAmount:
            data.remainingInvestAmount[0]?.remainingInvestAmount || "",
        },

        monthWiseInvestor: data.monthWiseInvestor
          ? await MonthNameAdd(startDate, endDate, data.monthWiseInvestor).map(
              (item) => ({
                ...item,
                _id: moment(item._id, "MMMM,YYYY").format("MMMM"),
                totalInvestAmount: item.totalInvestAmount
                  ? item.totalInvestAmount
                  : "",
                totalInvestorCount: item.totalInvestorCount
                  ? item.totalInvestorCount
                  : "",
              })
            )
          : [],
        monthWiseReedem: data.monthWiseReedem
          ? await MonthNameAdd(startDate, endDate, data.monthWiseReedem).map(
              (item) => ({
                ...item,
                _id: moment(item._id, "MMMM,YYYY").format("MMMM"),
                totalReedemAmount: item.totalReedemAmount
                  ? item.totalReedemAmount
                  : "",
              })
            )
          : [],
      },
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const loanPerformance = async (req, res) => {
  try {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    const commonQuery = [
      {
        $project: {
          monthYear: {
            $concat: [
              {
                $dateToString: {
                  format: "%B",
                  date: "$createdAt",
                },
              },
              ",",
              { $toString: { $year: "$createdAt" } },
            ],
          },
          loan: "$_id",
        },
      },
      {
        $group: {
          _id: "$monthYear",
          totalLoan: {
            $addToSet: "$loan",
          },
        },
      },
      {
        $project: {
          _id: 1,
          total: { $size: "$totalLoan" },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ];
    const positionList = PositionWiseData(req.user);
    const result = await Loan.aggregate([
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
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $facet: {
          lead: [
            {
              $match: {
                applicationStaus: "lead",
              },
            },
            { $count: "total" },
          ],
          approvedLoan: [
            {
              $match: {
                applicationStaus: "disbursed",
              },
            },
            { $count: "total" },
          ],
          incompletedLoan: [
            {
              $match: {
                applicationStaus: "incompleted",
              },
            },
            { $count: "total" },
          ],
          rejectLoan: [
            {
              $match: {
                applicationStaus: "rejected",
              },
            },
            { $count: "total" },
          ],

          totalEmi: [
            {
              $match: {
                applicationStaus: "disbursed",
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
                "emiSchedule.emiDate": {
                  $gte: startDate,
                  $lte: endDate,
                },
              },
            },
            { $count: "total" },
          ],
          paidEmi: [
            {
              $match: {
                applicationStaus: "disbursed",
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
                "emiSchedule.emiDate": {
                  $gte: startDate,
                  $lte: endDate,
                },
                "emiSchedule.isPaid": true,
              },
            },
            { $count: "total" },
          ],
          unpaidEmi: [
            {
              $match: {
                applicationStaus: "disbursed",
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
                "emiSchedule.emiDate": {
                  $gte: startDate,
                  $lte: endDate,
                },
                "emiSchedule.isPaid": false,
              },
            },
            { $count: "total" },
          ],
          defaultEmi: [
            {
              $match: {
                applicationStaus: "disbursed",
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
                "emiSchedule.emiDate": {
                  $gte: startDate,
                  $lte: endDate,
                },
                "emiSchedule.isPaid": false,
                "emiSchedule.emiDate": { $lt: new Date() },
              },
            },
            { $count: "total" },
          ],
          monthWiseLoan: [
            {
              $match: {
                applicationStaus: "disbursed",
              },
            },
            ...commonQuery,
          ],
          monthWiseLead: [
            {
              $match: {
                applicationStaus: "lead",
              },
            },
            ...commonQuery,
          ],
        },
      },
    ]);

    const data = result[0];

    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: {
        loan: {
          lead: data.lead[0]?.total || "",
          approvedLoan: data.approvedLoan[0]?.total || "",
          incompletedLoan: data.incompletedLoan[0]?.total || "",
          rejectLoan: data.rejectLoan[0]?.total || "",
        },

        emi: {
          totalEmi: data.totalEmi[0]?.total || "",
          paidEmi: data.paidEmi[0]?.total || "",
          unpaidEmi: data.unpaidEmi[0]?.total || "",
          defaultEmi: data.defaultEmi[0]?.total || "",
        },

        monthWiseLoan: data.monthWiseLoan
          ? await MonthNameAdd(startDate, endDate, data.monthWiseLoan).map(
              (item) => ({
                ...item,
                _id: moment(item._id, "MMMM,YYYY").format("MMMM"),
                total: item.total ? item.total : "",
              })
            )
          : [],
        monthWiseLead: data.monthWiseLead
          ? await MonthNameAdd(startDate, endDate, data.monthWiseLead).map(
              (item) => ({
                ...item,
                _id: moment(item._id, "MMMM,YYYY").format("MMMM"),
                total: item.total ? item.total : "",
              })
            )
          : [],
      },
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

import mongoose from "mongoose";
import { InvestmentTypes, PayoutFrequencies } from "./Finance.Config.js";
import moment from "moment";

export const GeneratePayout = (data) => {
  const payoutSchedule = [];
  let currentAmount = Number(data.investmentAmount);
  const interest =
    (Number(data.interestRate) / 100) * Number(data.payoutFrequency);
  for (
    let index = 1;
    index <= Number(data.duration) / Number(data.payoutFrequency);
    index++
  ) {
    const payoutAmount = currentAmount * interest;

    payoutSchedule.push({
      payoutDate: new Date(
        moment(data.payoutDate).add(
          Number(data.payoutFrequency) * index,
          "months"
        )
      ),
      payoutAmount: payoutAmount.toFixed(2),
      _id: new mongoose.Types.ObjectId(),
      isPaid: false,
      transactionNumber: null,
      paidBy: null,
      paidOn: null,
    });
  }

  return payoutSchedule;
};

export const DataManage = (data) => {
  let prepareData = {
    name: data.name,
    mobile: data.mobile,
    email: data.email,
    dob: data.dob,
    investmentType: data.investmentType,
    investmentAmount: data.investmentAmount,
    duration: data.duration,
    interestRate: data.interestRate,
    payoutFrequency: data.payoutFrequency,
    payoutDate: data.payoutDate,
    accountNumber: data.accountNumber,
    bankName: data.bankName,
    bankBranchName: data.bankBranchName,
    branch: data.branch,
    ifsc: data.ifsc,
    accountName: data.accountName,
    panNumber: data.panNumber,
    aadharNumber: data.aadharNumber,
    isInvestorActive: true,
    isFullyPaid: false,
    transactionNumber: null,
    paidOn: null,
  };
  if (data.investmentType === InvestmentTypes.BONDS) {
    prepareData.payoutSchedule = GeneratePayout({
      investmentAmount: data.investmentAmount,
      duration: data.duration,
      interestRate: data.interestRate,
      payoutFrequency:
        data.payoutFrequency === PayoutFrequencies.MONTHLY
          ? 1
          : data.payoutFrequency === PayoutFrequencies.QUARTERLY
          ? 3
          : data.payoutFrequency === PayoutFrequencies.SEMI_ANNUALLY
          ? 6
          : data.payoutFrequency === PayoutFrequencies.ANNUALLY
          ? 12
          : data.payoutFrequency === PayoutFrequencies.AT_MATURITY
          ? data.duration
          : 1,
      payoutDate: data.payoutDate,
    });
  }
  return prepareData;
};

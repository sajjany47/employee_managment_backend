import moment from "moment";
import mongoose from "mongoose";
import { GetFileName, GLocalImage } from "../../utilis/utilis.js";
import fs from "fs";
import employee from "../employess/employee.model.js";
import { City, Country, State } from "../Regional/Regional.model.js";
import charges from "../charges/charges.model.js";
import { Position } from "../employess/EmployeeConfig.js";

export const EmployeeTypes = ["salaried", "self_employed", "business"];

export const LoanApplicationSteps = [
  "incompleted",
  "application_number_generated",
  "loan_amount_generated",
  "document_address_verification",
  "business_address_verification",
  "document_verification",
  "loan_approved",
  "rejected",
  "disbursed",
];

export const LoanApplicationStepsEnum = {
  INCOMPLETED: "incompleted",
  APPLICATION_NUMBER_GENERATED: "application_number_generated",
  LOAN_AMOUNT_GENERATED: "loan_amount_generated",
  DOCUMENT_ADDRESS_VERIFICATION: "document_address_verification",
  BUSINESS_ADDRESS_VERIFICATION: "business_address_verification",
  DOCUMENT_VERIFICATION: "document_verification",
  LOAN_APPROVED: "loan_approved",
  REJECTED: "rejected",
  DISBURSED: "disbursed",
};

export const LoanStatusEnum = {
  LEAD: "lead",
  INCOMPLETED: "incompleted",
  PROGRESS: "progress",
  APPROVED: "approved",
  DISBURSED: "disbursed",
  REJECTED: "rejected",
};

export const ResidenceTypes = ["rented", "owned", "parent"];

export const LoanTypes = [
  "personal_loan",
  "home_loan",
  "car_loan",
  "education_loan",
  "business_loan",
  "payday_loan",
  "gold_loan",
  "mortgage_loan",
  "credit_card_loan",
  "agriculture_loan",
];

export const GenerateApplicationNumber = (loanType) => {
  const loanPrefixes = {
    personal_loan: "PLN",
    home_loan: "HLN",
    car_loan: "CLN",
    education_loan: "ELN",
    business_loan: "BLN",
    payday_loan: "PDL",
    gold_loan: "GLN",
    mortgage_loan: "MLN",
    credit_card_loan: "CCL",
    agriculture_loan: "ALN",
  };

  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const randomNumber = Math.floor(1000 + Math.random() * 9000);

  const prefix = loanPrefixes[loanType] || "GEN";

  return `${prefix}${year}${month}${day}${randomNumber}`;
};

export const EMICalculator = async (data) => {
  const query = data?.loanCharges
    ? {
        _id: new mongoose.Types.ObjectId(data.loanCharges),
      }
    : { isActive: true };
  const chargesDetails = await charges.findOne(query);
  // console.log(data);
  const P = Number(data.loanAmount);
  const r = Number(data.interestRate) / 100;
  const n = Number(data.loanTenure);

  const EMI = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  let outstanding = P;
  let emiSchedule = [];

  for (let index = 1; index <= n; index++) {
    const interest = outstanding * r;
    const principle = EMI - interest;
    outstanding -= principle;

    const date = data?.startDate ? data.startDate : new Date();
    const emiDate = moment(date).add(index, "months").format("YYYY-MM-DD");

    const foreClosureFees =
      (principle + outstanding) *
      (Number(
        chargesDetails?.foreclosureFees ? chargesDetails?.foreclosureFees : 0
      ) /
        100);
    const foreClosureGST =
      foreClosureFees *
      (Number(
        chargesDetails?.foreclosureFeesGST
          ? chargesDetails?.foreclosureFeesGST
          : 0
      ) /
        100);

    let foreclosureAmount = (
      principle +
      outstanding +
      interest +
      foreClosureFees +
      foreClosureGST
    ).toFixed(2);

    emiSchedule.push({
      _id: new mongoose.Types.ObjectId(),
      emiDate: new Date(emiDate),
      emiAmount: EMI.toFixed(2),
      interestPaid: interest.toFixed(2),
      principalPaid: principle.toFixed(2),
      isPaid: false,
      remainingOutstanding: outstanding.toFixed(2),
      foreclosureAmount:
        index >
        Number(
          chargesDetails?.foreclosureApply
            ? chargesDetails?.foreclosureApply
            : 0
        )
          ? index === n
            ? EMI.toFixed(2)
            : foreclosureAmount
          : "Not applicable",
    });
  }

  return { emi: EMI.toFixed(2), emiSchedule: emiSchedule };
};

export const DisbursmentCalculate = async (data) => {
  const query = data?.loanCharges
    ? {
        _id: new mongoose.Types.ObjectId(data.loanCharges),
      }
    : { isActive: true };
  const chargesDetails = await charges.findOne(query);
  const processingFees =
    Number(data.loanAmount) *
    (Number(
      chargesDetails?.processingFees ? chargesDetails?.processingFees : 0
    ) /
      100);

  const processingFeesGST =
    processingFees *
    (Number(
      chargesDetails?.processingFeesGST ? chargesDetails?.processingFeesGST : 0
    ) /
      100);

  const loginFees = Number(
    chargesDetails?.loginFees ? chargesDetails?.loginFees : 0
  );
  const loginFeesGST =
    loginFees *
    (Number(chargesDetails?.loginFeesGST ? chargesDetails?.loginFeesGST : 0) /
      100);

  const otherCharges = Number(
    chargesDetails?.otherCharges ? chargesDetails?.otherCharges : 0
  );
  const otherChargesGST =
    otherCharges *
    (Number(
      chargesDetails?.otherChargesGST ? chargesDetails?.otherChargesGST : 0
    ) /
      100);

  const totalDeductions =
    processingFees +
    processingFeesGST +
    loginFees +
    loginFeesGST +
    otherCharges +
    otherChargesGST;

  const disbursedAmount = Number(data.loanAmount) - totalDeductions;

  return {
    disbursedAmount: disbursedAmount.toFixed(2), // corrected typo from "diburedAmount"
    processingFees: processingFees.toFixed(2),
    processingFeesGST: processingFeesGST.toFixed(2),
    loginFees: loginFees.toFixed(2),
    loginFeesGST: loginFeesGST.toFixed(2),
    otherCharges: otherCharges.toFixed(2),
    otherChargesGST: otherChargesGST.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
  };
};

export const LoanImageUpload = async (imageName, uploadFile) => {
  if (imageName) {
    const deletePath = GLocalImage(imageName, process.env.LOAN_PATH);
    await fs.promises.unlink(deletePath);
  }
  const file = uploadFile;
  const fileName = GetFileName(uploadFile);
  const uploadPath = GLocalImage(fileName, process.env.LOAN_PATH);

  await file.mv(uploadPath);

  return fileName;
};

export const AcccessPositionWise = (user) => {
  let query = [];
  if (user.country !== null) {
    query.push({ country: Number(user.country) });
  }
  if (user.state !== null) {
    query.push({ state: Number(user.state) });
  }
  if (user.city !== null) {
    query.push({ city: Number(user.city) });
  }
  if (user.branch !== null) {
    query.push({ branch: new mongoose.Types.ObjectId(user.branch) });
  }

  return query;
};

export const DataWithEmployeeName = async (id) => {
  const findEmployee = await employee.findOne({
    _id: new mongoose.Types.ObjectId(id),
  });
  if (findEmployee) {
    return {
      _id: findEmployee._id,
      name: findEmployee.name,
      username: findEmployee.username,
    };
  }
};

export const CountryName = async (id) => {
  const countryData = await Country.findOne({ id: Number(id) });

  return countryData.name;
};

export const StateName = async (id) => {
  const stateData = await State.findOne({ id: Number(id) });

  return stateData.name;
};
export const CityName = async (id) => {
  const cityData = await City.findOne({ id: Number(id) });

  return cityData.name;
};

export const FormatType = (str) => {
  // Replace underscores with spaces and capitalize each word
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const LoanDivide = async (postion, branch) => {
  const employeeList = await employee
    .find({
      isActive: true,
      position: postion,
      branch: new mongoose.Types.ObjectId(branch),
    })
    .sort({ assignedLoansCount: 1 });
  if (employeeList) {
    await employee.updateOne(
      { _id: new mongoose.Types.ObjectId(employeeList[0]._id) },
      { $set: { assignedLoansCount: employeeList[0].assignedLoansCount + 1 } }
    );
    return employeeList[0]._id;
  }
};

// const myPincode = 700053;
// const pincodes = [700026, 700045, 700007, 700012, 700057, 700001];

// // Function to find the nearest pincode
// function findNearestPincode(myPincode, pincodes) {
//   return pincodes.reduce((nearest, currentPincode) => {
//     return Math.abs(currentPincode - myPincode) < Math.abs(nearest - myPincode)
//       ? currentPincode
//       : nearest;
//   });
// }

// const nearestPincode = findNearestPincode(myPincode, pincodes);
// console.log(`The nearest pincode is: ${nearestPincode}`);

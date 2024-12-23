import mongoose from "mongoose";
import {
  DisbursmentCalculate,
  EMICalculator,
  LoanApplicationStepsEnum,
  LoanStatusEnum,
} from "./loan.config.js";

export const LeadData = (data) => {
  const prepareData = {
    name: data.name,
    mobile: data.mobile,
    email: data.email,
    loanType: new mongoose.Types.ObjectId(data.loanType),
    loanAmount: Number(data.loanAmount),
    loanTenure: Number(data.loanTenure),
    monthlyIncome: Number(data.monthlyIncome),
    branch: new mongoose.Types.ObjectId(data.branch),
    applicationStaus: LoanStatusEnum.LEAD,
  };

  return prepareData;
};

export const BasicData = (data) => {
  const prepareData = {
    loanAmount: Number(data.loanAmount),
    loanTenure: Number(data.loanTenure),
    name: data.name,
    mobile: data.mobile,
    email: data.email,
    dob: new Date(data.dob),
    branch: new mongoose.Types.ObjectId(data.branch),
    loanType: new mongoose.Types.ObjectId(data.loanType),
    fatherName: data.fatherName,
    motherName: data.motherName,
    activeIndex: 0,
    applicationStaus: LoanStatusEnum.INCOMPLETED,
    status: LoanApplicationStepsEnum.INCOMPLETED,
    loanAllotAgent: new mongoose.Types.ObjectId(data.operationBy),
  };

  return prepareData;
};

export const AddressData = (data) => {
  const prepareData = {
    permanentHouseOrBuildingNumber: data.permanentHouseOrBuildingNumber,
    permanentStreet: data.permanentStreet,
    permanentLandmark: data.permanentLandmark,
    permanentPincode: data.permanentPincode,
    permanentState: Number(data.permanentState),
    permanentCountry: Number(data.permanentCountry),
    permanentCity: Number(data.permanentCity),
    residenceHouseOrBuildingNumber: data.residenceHouseOrBuildingNumber,
    residenceStreet: data.residenceStreet,
    residenceLandmark: data.residenceLandmark,
    residencePincode: data.residencePincode,
    residenceState: Number(data.residenceState),
    residenceCountry: Number(data.residenceCountry),
    residenceCity: Number(data.residenceCity),
    addressSame: data.addressSame,
    residenceType: data.residenceType,
    applicationStaus: LoanStatusEnum.INCOMPLETED,
    status: LoanApplicationStepsEnum.INCOMPLETED,
    activeIndex: 1,
  };

  return prepareData;
};

export const WorkData = (data) => {
  const prepareData = {
    companyOrBussinessName: data.companyOrBussinessName,
    jobTitle: data.jobTitle,
    employmentType: data.employmentType,
    yearsOfExperience: Number(data.yearsOfExperience),
    monthlyIncome: Number(data.monthlyIncome),
    shopOrBuildingNumber: data.shopOrBuildingNumber,
    workStreet: data.workStreet,
    workLandmark: data.workLandmark,
    workPincode: data.workPincode,
    workState: Number(data.workState),
    workCountry: Number(data.workCountry),
    workCity: Number(data.workCity),
    applicationStaus: LoanStatusEnum.INCOMPLETED,
    status: LoanApplicationStepsEnum.INCOMPLETED,
    activeIndex: 2,
  };

  return prepareData;
};

export const AccountData = async (data) => {
  const prepareData = {
    accountNumber: data.accountNumber,
    bankName: data.bankName,
    bankBranchName: data.bankBranchName,
    ifsc: data.ifsc,
    accountName: data.accountName,
    applicationStaus: LoanStatusEnum.PROGRESS,
    status: LoanApplicationStepsEnum.APPLICATION_NUMBER_GENERATED,
    activeIndex: -1,
  };

  return prepareData;
};

export const StatusData = async (data) => {
  let prepareData = {
    applicationStaus:
      data.status === LoanApplicationStepsEnum.LOAN_APPROVED
        ? LoanStatusEnum.APPROVED
        : data.status === LoanApplicationStepsEnum.REJECTED
        ? LoanStatusEnum.REJECTED
        : data.status === LoanApplicationStepsEnum.DISBURSED
        ? LoanStatusEnum.DISBURSED
        : data.status === LoanApplicationStepsEnum.INCOMPLETED
        ? LoanStatusEnum.INCOMPLETED
        : LoanStatusEnum.PROGRESS,
    status: data.status,
    remark: data.remark,
  };

  if (data.status === LoanApplicationStepsEnum.DOCUMENT_ADDRESS_VERIFICATION) {
    prepareData.addressVerifiedBy = data.user;
  }
  if (data.status === LoanApplicationStepsEnum.BUSINESS_ADDRESS_VERIFICATION) {
    prepareData.officeOrBussinessVerifiedBy = data.user;
  }
  if (data.status === LoanApplicationStepsEnum.DOCUMENT_VERIFICATION) {
    prepareData.documentVerifiedBy = data.user;
  }
  if (data.status === LoanApplicationStepsEnum.LOAN_APPROVED) {
    prepareData.loanVerifiedBy = data.user;
    prepareData.interestRate = Number(data.interestRate);
  }

  if (data.status === LoanApplicationStepsEnum.DISBURSED) {
    const EMI = await EMICalculator({
      loanAmount: Number(data.loanAmount),
      interestRate: Number(data.interestRate),
      loanTenure: Number(data.loanTenure),
      startDate: data.emiDate,
    });

    const disbursment = await DisbursmentCalculate({
      loanAmount: Number(data.loanAmount),
    });
    (prepareData.loanCharges = new mongoose.Types.ObjectId(data.loanCharges)),
      (prepareData.interestRate = data.interestRate);
    prepareData.transactionNumber = data.transactionNumber;
    prepareData.disbursedBy = data.user;
    prepareData.EMIMonthly = EMI.emi;
    prepareData.emiSchedule = EMI.emiSchedule;
    prepareData.disbursment = disbursment;
    prepareData.isLoanActive = true;
    prepareData.status = LoanApplicationStepsEnum.DISBURSED;
  }

  return prepareData;
};

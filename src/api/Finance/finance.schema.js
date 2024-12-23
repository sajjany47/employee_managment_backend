import * as Yup from "yup";

export const financeSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  mobile: Yup.string().required("Mobile number is required"),
  email: Yup.string()
    // .matches("/S+@S+.S+/", "Please enter valid email")
    .required("Email is required"),
  dob: Yup.date()
    .required("Date of birth is required")
    .max(new Date(Date.now() - 567648000000), "You must be at least 18 years"),
  bankName: Yup.string().required("Bank name is required"),
  accountNumber: Yup.string().required("Account number is required"),
  bankBranchName: Yup.string().required("Branch name is required"),
  ifsc: Yup.string().required("IFSC code is required"),
  accountName: Yup.string().required("Account name is required"),
  investmentType: Yup.string().required("Investment type is required"),
  investmentAmount: Yup.string().required("Investment amount is required"),
  duration: Yup.string().required("Duration is required"),
  interestRate: Yup.string().required("Interest Rate is required"),
  payoutFrequency: Yup.string().required("Payout frequency is required"),
  payoutDate: Yup.string().required("Payout date is required"),
  aadharNumber: Yup.string().required("Aadhar Number is required"),
  panNumber: Yup.string().required("Pan number is required"),
  branch: Yup.string().required("Branch is required"),
});

export const payNowSchema = Yup.object({
  accountNumber: Yup.string().required("Account number is required"),
  amount: Yup.string().required("Amount is required"),
  accountName: Yup.string().required("Account name is required"),
  bankName: Yup.string().required("Bank name is required"),
  ifsc: Yup.string().required("IFSC is required"),
  transactionNumber: Yup.string().required("Transaction Number is required"),
});

export const reedemApplySchema = Yup.object({
  investmentAmount: Yup.string().required("Investment Amount is required"),
  reedemAmount: Yup.string().required("Reedem amount is required"),
  reedemDate: Yup.date().required("Reedem date is required"),
  remainingInvestAmount: Yup.string().required(
    "Remaining invested amount is required"
  ),
  duration: Yup.string().when("remainingInvestAmount", {
    is: (values) => Number(values) !== 0,
    then: () => Yup.string().required("Duration is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
  interestRate: Yup.string().when("remainingInvestAmount", {
    is: (values) => Number(values) !== 0,
    then: () => Yup.string().required("Interest Rate is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
  payoutFrequency: Yup.string().when("remainingInvestAmount", {
    is: (values) => Number(values) !== 0,
    then: () => Yup.string().required("Payout frequency is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
  payoutDate: Yup.string().when("remainingInvestAmount", {
    is: (values) => Number(values) !== 0,
    then: () => Yup.string().required("Payout date is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
});

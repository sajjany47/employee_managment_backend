import mongoose from "mongoose";

const financeModel = new mongoose.Schema(
  {
    name: String,
    mobile: String,
    email: String,
    dob: Date,
    investmentType: String,
    initialCapital: Number,
    investmentAmount: Number,
    duration: Number,
    interestRate: Number,
    branch: mongoose.Schema.Types.ObjectId,
    payoutFrequency: String,
    payoutDate: Date,
    accountNumber: String,
    isMaturityCompleted: Boolean,
    isInvestorActive: Boolean,
    paidOn: Date,
    transactionNumber: String,
    isFullyPaid: Boolean,
    bankName: String,
    bankBranchName: String,
    ifsc: String,
    accountName: String,
    planDetails: Array,
    payoutSchedule: Array,
    payoutReedem: Array,
    aadharNumber: String,
    panNumber: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

const finance = mongoose.model("finance", financeModel);

export default finance;

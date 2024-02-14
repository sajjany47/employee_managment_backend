import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    activationCode: String,
    name: String,
    username: { type: String, trim: true, lowercase: true },
    role: {
      type: String,
      trim: true,
      lowercase: true,
      enum: ["admin", "employee", "hr"],
    },
    isLeaveAllocated: Boolean,
    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dob: Date,
    address: { type: String },
    state: { name: String, value: String },
    country: { name: String, value: String },
    city: { name: String, value: String },
    pincode: { type: String, trim: true },
    password: { type: String, trim: true },
    position: { type: String, trim: true, lowercase: true },
    skill: Array,
    education: [
      {
        boardName: { type: String, lowercase: true },
        passingYear: { type: String, trim: true },
        marksPercentage: { type: String, trim: true },
      },
    ],
    workDetail: [
      {
        companyName: { type: String, lowercase: true },
        position: { type: String, lowercase: true },
        startingYear: { type: String, trim: true },
        endingYear: { type: String, trim: true },
      },
    ],
    document: {
      aadharNumber: { type: String, trim: true },
      voterNumber: { type: String, trim: true },
      panNumber: { type: String, trim: true },
      passportNumber: { type: String, trim: true },
    },
    bankDetails: {
      bankName: { type: String, lowercase: true },
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true },
      branchName: { type: String, lowercase: true },
    },
    activeStatus: Boolean,
    createdBy: String,
    updatedBy: String,
    registrationStatus: {
      type: String,
      trim: true,
      lowercase: true,
      enum: ["waiting", "pending", "verified", "rejected"],
    },
    approvedBy: String,
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema);
export default user;

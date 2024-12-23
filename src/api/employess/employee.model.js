import { ResidenceTypes } from "../loan/loan.config.js";
import { Position, Status, fresherOrExperience } from "./EmployeeConfig.js";

import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: String,
    name: String,
    username: String,
    position: {
      type: String,
      trim: true,
      enum: [
        Position.ADMIN,
        Position.BM,
        Position.SM,
        Position.LM,
        Position.PM,
        Position.AM,
        Position.CDM,
        Position.CD,
        Position.LD,
        Position.VD,
        Position.FM,
        Position.CM,
      ],
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dob: Date,
    state: {
      type: Number,
      default: null,
    },
    country: {
      type: Number,
      default: null,
    },
    city: {
      type: Number,
      default: null,
    },
    assignedLoansCount: { type: Number, default: 0 },
    password: String,
    sessionId: String,
    isPasswordReset: Boolean,
    userImage: String,
    permanentHouseOrBuildingNumber: String,
    permanentStreet: String,
    permanentLandmark: String,
    permanentPincode: String,
    permanentState: Number,
    permanentCountry: Number,
    permanentCity: Number,
    residenceHouseOrBuildingNumber: String,
    residenceStreet: String,
    residenceLandmark: String,
    residencePincode: String,
    residenceState: Number,
    residenceCountry: Number,
    residenceCity: Number,
    residenceType: {
      type: String,
      enum: ResidenceTypes,
    },
    addressSame: Boolean,
    education: [
      {
        boardName: { type: String },
        passingYear: { type: String, trim: true },
        marksPercentage: { type: String, trim: true },
        resultImage: String,
      },
    ],
    fresherOrExperience: {
      type: String,
      enum: [fresherOrExperience.EXPERIENCE, fresherOrExperience.FRESHER],
    },
    workDetail: [
      {
        companyName: { type: String },
        position: { type: String },
        startingYear: { type: String, trim: true },
        endingYear: { type: String, trim: true },
        experienceLetter: String,
        relievingLetter: String,
        appointmentLetter: String,
        salarySlip: String,
      },
    ],
    aadharNumber: { type: String, trim: true },
    passportImage: String,
    voterImage: String,
    panImage: String,
    aadharImage: String,
    passbookImage: String,
    uanImage: String,
    voterNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    passportNumber: { type: String, trim: true },
    bankName: { type: String, lowercase: true },
    accountNumber: { type: String, trim: true },
    bankBranchName: String,
    uan: String,
    uanImage: String,
    ifsc: { type: String, trim: true },
    isProfileVerified: {
      type: String,
      trim: true,
      lowercase: true,
      enum: [Status.PENDING, Status.VERIFIED, Status.REJECTED],
    },
    profileRatio: String,
    approvedBy: String,
    isActive: Boolean,
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,
    pageIndex: Number,
  },
  {
    timestamps: true,
  }
);

const employee = mongoose.model("employee", employeeSchema);

export default employee;

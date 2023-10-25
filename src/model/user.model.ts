import mongoose from "mongoose";

export const userSchema = new mongoose.Schema(
  {
    role: String,
    activationCode: String,
    name: String,
    username: String,
    password: String,
    mobile: Number,
    email: String,
    dob: Date,
    address: String,
    state: String,
    district: String,
    city: String,
    pincode: String,
    education: [
      {
        boardName: String,
        passingYear: Number,
        marksPercentage: String,
      },
    ],
    workDetail: [
      {
        companyName: String,
        companyAddress: String,
        startingYear: Number,
        endingYear: Number,
      },
    ],
    document: {
      aadharNumber: Number,
      voterNumber: String,
      panNumber: String,
    },
    bankDetails: {
      bankName: String,
      accountNumber: Number,
      ifsc: String,
      branchName: String,
    },
    activeStatus: Boolean,
    createdBy: String,
    updatedBy: String,
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema);
export default user;

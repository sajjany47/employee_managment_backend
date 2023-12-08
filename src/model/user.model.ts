import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    activationCode: String,
    name: String,
    username: String,
    role: String,
    mobile: String,
    email: String,
    dob: Date,
    address: String,
    state: String,
    district: String,
    city: String,
    pincode: String,
    password: String,
    education: [
      {
        boardName: String,
        passingYear: String,
        marksPercentage: String,
      },
    ],
    workDetail: [
      {
        companyName: String,
        position: String,
        startingYear: String,
        endingYear: String,
      },
    ],
    document: {
      aadharNumber: String,
      voterNumber: String,
      panNumber: String,
      passportNumber: String,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifsc: String,
      branchName: String,
    },
    activeStatus: Boolean,
    createdBy: String,
    updatedBy: String,
    registrationStatus: String,
    approvedBy: String,
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema);
export default user;

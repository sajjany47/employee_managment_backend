import mongoose from "mongoose";

const userSalary = new mongoose.Schema(
  {
    username: String,
    currentSalary: {
      basicSalary: Number,
      hra: Number,
      travelAllowance: Number,
      MedicalAllowance: Number,
      LeaveTravelAllowance: Number,
      SpecialAllowance: Number,
      providentFund: Number,
      professionalTax: Number,
      incomeTax: Number,
      incrementType: {
        type: String,
        trim: true,
        lowercase: true,
        enum: ["fixed", "percentage"],
      },
      incrementValue: String,
      totalEarning: Number,
      updatedBy: String,
      date: Date,
      healthInsurance: Number,
    },
    salaryHistory: [
      {
        basicSalary: Number,
        hra: Number,
        travelAllowance: Number,
        MedicalAllowance: Number,
        LeaveTravelAllowance: Number,
        SpecialAllowance: Number,
        providentFund: Number,
        professionalTax: Number,
        incomeTax: Number,
        incrementType: {
          type: String,
          trim: true,
          lowercase: true,
          enum: ["fixed", "percentage"],
        },
        incrementValue: String,
        totalEarning: Number,
        updatedBy: String,
        date: Date,
        healthInsurance: Number,
      },
    ],
  },
  { timestamps: true }
);

const salary = mongoose.model("user_salary", userSalary);

export default salary;

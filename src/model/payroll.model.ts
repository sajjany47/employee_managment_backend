import mongoose from "mongoose";

const userPayroll = new mongoose.Schema(
  {
    date: String,
    userPayroll: [
      {
        username: String,
        date: String,
        currentMonthTotalLeave: Number,
        present: Number,
        absent: Number,
        currentMonthTotalHoliday: Number,
        totalMonthDays: Number,
        totalWeekend: Number,
        salaryStatus: {
          type: String,
          lowercase: true,
          trim: true,
          enum: ["pending", "paid"],
        },
        transactionNumber: String,
        transactionDate: Date,
        accountNumber: String,
        bankName: String,
        ifsc: String,
        branchName: String,
        currentMonthSalary: Object,
        updatedBy: String,
        updatedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

const payroll = mongoose.model("user_payroll", userPayroll);

export default payroll;

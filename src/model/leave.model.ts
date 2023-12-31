import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    user_id: String,
    totalLeaveLeft: String,
    totalLeave: String,
    leaveDetails: [
      { startDay: Date, endDay: Date, totalDays: String, approvedBy: String },
    ],
    updatedBy: String,
  },
  { timestamps: true }
);

const leave = mongoose.model("leaveList", leaveSchema);

export default leave;

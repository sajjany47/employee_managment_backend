import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  user_id: String,
  totalLeaveLeft: String,
  totalLeave: String,
  leaveDetails: [
    { startDay: Date, endDay: Date, totalDays: String, approvedBy: String },
  ],
});

const leave = mongoose.model("leave", leaveSchema);

export default leave;

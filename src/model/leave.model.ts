import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    user_id: String,
    leaveDetail: [
      {
        leaveYear: String,
        totalLeaveLeft: String,
        totalLeave: String,
        leaveUseDetail: [
          {
            startDay: Date,
            endDay: Date,
            totalDays: String,
            leaveStatus: {
              type: String,
              trim: true,
              lowercase: true,
              enum: ["pending", "approved", "rejected"],
            },
            approvedBy: String,
          },
        ],
      },
    ],

    updatedBy: String,
  },
  { timestamps: true }
);

const leave = mongoose.model("leaveList", leaveSchema);

export default leave;

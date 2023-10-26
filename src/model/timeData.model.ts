import mongoose from "mongoose";

const timeData = new mongoose.Schema(
  {
    username: String,
    timeSchedule: [
      {
        date: Date,
        time: Number,
      },
    ],
  },
  { timestamps: true }
);

const timeRecord = mongoose.model("timeRecord", timeData);

export default timeRecord;

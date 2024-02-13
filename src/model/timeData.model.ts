import mongoose from "mongoose";

const timeData = new mongoose.Schema(
  // {
  //   username: String,
  //   timeSchedule: [
  //     {
  //       date: String,
  //       totalTime: Number,
  //       startTime: String,
  //       endTime: String,
  //     },
  //   ],
  // },
  {
    username: String,
    timeSchedule: [
      {
        date: String,
        totalTime: Number,
        startDisabled: Boolean,
        endDisabled: Boolean,
        startTime: String,
        endTime: String,
      },
    ],
  },
  { timestamps: true }
);

const timeRecord = mongoose.model("timeRecord", timeData);

export default timeRecord;

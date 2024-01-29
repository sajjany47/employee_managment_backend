import mongoose from "mongoose";

const timeData = new mongoose.Schema(
  {
    username: String,
    timeSchedule: [
      {
        year: String,
        timeData: [
          {
            timeDetails: [{ startTime: String, endTime: String }],
            date: String,
            totalTime: Number,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const timeRecord = mongoose.model("timeRecord", timeData);

export default timeRecord;

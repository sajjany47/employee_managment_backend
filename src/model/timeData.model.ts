import mongoose from "mongoose";

const timeData = new mongoose.Schema(
  {
    username: String,
    timeSchedule: [
      {
        year: String,
        timeData: [
          {
            startTime: String,
            endTime: String,
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

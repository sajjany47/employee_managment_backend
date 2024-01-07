import mongoose from "mongoose";

const officeHoliday = new mongoose.Schema(
  {
    holidayYear: String,
    holidayList: [
      {
        holidayDate: { type: Date },
        reason: { type: String, lowercase: true },
        createdBy: String,
      },
    ],
  },
  { timestamps: true }
);

const holidayList = mongoose.model("holidayList", officeHoliday);
export default holidayList;

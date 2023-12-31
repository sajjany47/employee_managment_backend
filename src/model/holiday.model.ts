import mongoose from "mongoose";

const officeHoliday = new mongoose.Schema(
  {
    holidayList: [
      {
        holidayDate: { type: Date },
        reason: { type: String, lowercase: true },
      },
    ],
    updatedBy: String,
  },
  { timestamps: true }
);

const holidayList = mongoose.model("holidayList", officeHoliday);
export default holidayList;

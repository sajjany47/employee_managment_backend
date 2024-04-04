import mongoose from "mongoose";

const userNotify = new mongoose.Schema(
  {
    receiver: String,
    date: Date,
    remark: String,
    status: Boolean,
  },
  { timestamps: true }
);

const notify = mongoose.model("notification", userNotify);

export default notify;

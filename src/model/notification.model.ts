import mongoose from "mongoose";

const userNotify = new mongoose.Schema(
  {
    receiver: Array,
    date: Date,
    remark: String,
    status: Boolean,
    isHide: Boolean,
  },
  { timestamps: true }
);

const notify = mongoose.model("notification", userNotify);

export default notify;

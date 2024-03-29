import mongoose from "mongoose";

const userNotify = new mongoose.Schema({
  notifyId: mongoose.Schema.ObjectId,
  sender: String,
  receiver: String,
  date: Date,
  remark: String,
  status: Boolean,
});

const notify = mongoose.model("notification", userNotify);

export default notify;

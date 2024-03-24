import mongoose from "mongoose";

const taskModel = new mongoose.Schema(
  {
    taskSender: String,
    taskReceiver: String,
    taskDate: Date,
    taskYear: Date,
    taskStatus: {
      type: String,
      trim: true,
      lowercase: true,
      enum: [
        "todo",
        "hold",
        "cancelled",
        "need-Attention",
        "waiting-for-review",
        "under-review",
        "completed",
      ],
    },
    taskRating: Number,
    takDeadline: Date,
    taskDetails: String,
    taskRemark: String,
    taskProject: String,
  },
  { timestamps: true }
);

const task = mongoose.model("task", taskModel);

export default task;

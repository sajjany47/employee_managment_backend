import mongoose from "mongoose";

const taskModel = new mongoose.Schema(
  {
    taskSender: String,
    taskReceiver: String,
    taskStartDate: Date,
    takDeadline: Date,
    taskYear: Date,
    taskStatus: {
      type: String,
      trim: true,
      lowercase: true,
      enum: [
        "assign",
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
    taskDetails: String,
    taskRemark: String,
    taskProject: String,
  },
  { timestamps: true }
);

const task = mongoose.model("task", taskModel);

export default task;

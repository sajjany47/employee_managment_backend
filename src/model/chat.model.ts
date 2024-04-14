import mongoose from "mongoose";

const userChat = new mongoose.Schema({
  sender: String,
  receiver: String,
  message: String,
  document: String,
  date: Date,
  status: { type: String, enum: ["sent", "deliver", "seen"] },
});

const chat = mongoose.model("chat", userChat);

export default chat;

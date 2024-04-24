import mongoose from "mongoose";

const userChat = new mongoose.Schema({
  sender: String,
  receiver: String,
  chat: [
    {
      date: Date,
      name: String,
      message: String,
      document: String,
      status: { type: String, enum: ["sent", "deliver", "seen"] },
    },
  ],
});

const chat = mongoose.model("chat", userChat);

export default chat;

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  mobile: Number,
  email: String,
  dob: Date,
  address: String,
  state: String,
  district: String,
  city: String,
  pincode: String,
});

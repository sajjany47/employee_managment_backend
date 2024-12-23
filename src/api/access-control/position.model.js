import mongoose from "mongoose";

const positionModel = new mongoose.Schema(
  {
    name: String,
    isActive: Boolean,
    menu: Array,
    key: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

const position = mongoose.model("position", positionModel);

export default position;

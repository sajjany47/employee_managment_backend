import mongoose from "mongoose";

const accessControlModel = new mongoose.Schema(
  {
    name: String,
    isActive: Boolean,
    childMenu: Array,
    icon: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

const accessControl = mongoose.model("access_control", accessControlModel);

export default accessControl;

import mongoose from "mongoose";
import { GetFileName, GLocalImage } from "../../utilis/utilis.js";
import fs from "fs";

export const Position = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  BM: "branch-manager",
  SM: "state-manager",
  CM: "city-manager",
  LM: "loan-manager",
  PM: "product-manager",
  CDM: "collection-department-head",
  CD: "collection-department",
  LD: "loan-department",
  VD: "verification-department",
  FM: "financial-manager",
};

export const Status = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

export const fresherOrExperience = {
  FRESHER: "fresher",
  EXPERIENCE: "experience",
};

export const EmployeeDocumentImageUpload = async (
  actionType,
  findArray,
  productId,
  imageKey,
  uploadFile
) => {
  if (actionType !== "add") {
    const findEducationImage = findArray.find(
      (item) => item.id.toString() === productId
    );
    if (findEducationImage[imageKey]) {
      const deletePath = GLocalImage(
        findEducationImage[imageKey],
        process.env.EMPLOYEE_PATH
      );

      await fs.promises.unlink(deletePath);
    }
  }
  const file = uploadFile;
  const fileName = GetFileName(uploadFile);
  const uploadPath = GLocalImage(fileName, process.env.EMPLOYEE_PATH);

  await file.mv(uploadPath);

  return fileName;
};

export const EmployeeImageUpload = async (imageName, uploadFile) => {
  if (imageName) {
    const deletePath = GLocalImage(imageName, process.env.EMPLOYEE_PATH);
    await fs.promises.unlink(deletePath);
  }
  const file = uploadFile;
  const fileName = GetFileName(uploadFile);
  const uploadPath = GLocalImage(fileName, process.env.EMPLOYEE_PATH);

  await file.mv(uploadPath);

  return fileName;
};

export const PositionWiseData = (data) => {
  const positionWise = [];

  if (data.position === Position.SM) {
    positionWise.push({ "branchDetails.country": data.country });
    positionWise.push({ "branchDetails.state": data.state });
  }
  if (data.position === Position.CM) {
    positionWise.push({ "branchDetails.country": data.country });
    positionWise.push({ "branchDetails.state": data.state });
    positionWise.push({ "branchDetails.city": data.city });
  }

  if (
    data.position === Position.BM ||
    data.position === Position.LM ||
    data.position === Position.LD ||
    data.position === Position.VD ||
    data.position === Position.FM
  ) {
    positionWise.push({
      branch: new mongoose.Types.ObjectId(data.branch),
    });
  }

  return positionWise;
};

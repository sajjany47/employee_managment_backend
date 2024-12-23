import { StatusCodes } from "http-status-codes";
import { createBranchSchema } from "./branch.schema.js";
import branch from "./branch.model.js";
import mongoose from "mongoose";
import { BuildRegexQuery } from "../../utilis/utilis.js";
import { GenerateBranchCode } from "./branch.config.js";

export const createBranch = async (req, res) => {
  try {
    const validateData = await createBranchSchema.validate(req.body);
    if (validateData) {
      const checkNameAndCode = await branch.findOne({
        name: validateData.name,
        code: validateData.code,
      });
      if (!checkNameAndCode) {
        const branchData = new branch({
          name: validateData.name,
          country: Number(validateData.country),
          state: Number(validateData.state),
          city: Number(validateData.city),
          email: validateData.email,
          phone: validateData.phone,
          address: validateData.address,
          pincode: validateData.pincode,
          code: await GenerateBranchCode(
            validateData.countryName,
            validateData.stateName,
            validateData.cityName,
            validateData.pincode
          ),
          countryName: validateData.countryName,
          stateName: validateData.stateName,
          cityName: validateData.cityName,
          isActive: true,
          createdBy: req.user._id,
          updatedBy: null,
        });

        const branchCreate = await branchData.save();

        return res
          .status(StatusCodes.OK)
          .json({ message: "Branch created successfully", data: branchCreate });
      }
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const validateData = await createBranchSchema.validate(req.body);
    if (validateData) {
      const checkValidBranch = await branch.findOne({
        _id: new mongoose.Types.ObjectId(validateData._id),
      });
      if (checkValidBranch) {
        const branchData = {
          country: Number(validateData.country),
          state: Number(validateData.state),
          city: Number(validateData.city),
          email: validateData.email,
          phone: validateData.phone,
          address: validateData.address,
          pincode: validateData.pincode,
          isActive: validateData.isActive,
          countryName: validateData.countryName,
          stateName: validateData.stateName,
          cityName: validateData.cityName,
          updatedBy: req.user._id,
        };

        const branchUpdate = await branch.updateOne(
          { _id: new mongoose.Types.ObjectId(validateData._id) },
          { $set: branchData }
        );

        return res
          .status(StatusCodes.OK)
          .json({ message: "Branch updated successfully", data: branchUpdate });
      }
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const branchList = async (req, res) => {
  try {
    const reqData = req.query;
    const query = {};
    if (reqData.hasOwnProperty("country")) {
      query.country = Number(reqData.country);
    }
    if (reqData.hasOwnProperty("state")) {
      query.state = Number(reqData.state);
    }
    if (reqData.hasOwnProperty("city")) {
      query.city = Number(reqData.city);
    }

    const data = await branch.aggregate([
      { $match: Object.keys(query).length > 0 ? query : {} },
    ]);

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: data });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const dataTable = async (req, res) => {
  try {
    const reqData = req.body;
    const page = reqData.page;
    const limit = reqData.limit;
    const start = page * limit - limit;
    const query = [];
    if (reqData.name) {
      query.push(BuildRegexQuery("name", reqData.name));
    }
    if (reqData.country) {
      query.push({ country: reqData.country });
    }
    if (reqData.hasOwnProperty("state")) {
      query.push({ state: reqData.state });
    }
    if (reqData.hasOwnProperty("city")) {
      query.push({ city: reqData.city });
    }
    if (reqData.pincode) {
      query.push(BuildRegexQuery("pincode", reqData.pincode));
    }
    if (reqData.code) {
      query.push(BuildRegexQuery("code", reqData.code));
    }
    if (reqData.hasOwnProperty("isActive")) {
      query.push({ isActive: reqData.isActive });
    }

    const data = await branch.aggregate([
      { $match: query.length > 0 ? { $and: query } : {} },
      {
        $facet: {
          count: [{ $count: "total" }],
          data: [
            {
              $sort: reqData.sort || { name: 1 },
            },
            { $skip: start },
            { $limit: limit },
          ],
        },
      },
    ]);

    return res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: data[0].data,

      count: data[0].count[0] ? data[0].count[0].total : 0,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

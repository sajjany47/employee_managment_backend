import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import user from "../model/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import mongoose from "mongoose";
import leave from "../model/leave.model";
import moment from "moment";

const generateActivationKey = async (req: Request, res: Response) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const findDuplicateUser = await user.findOne({
      $or: [
        {
          username: reqData.username,
        },
        {
          email: reqData.email,
        },
        {
          mobile: reqData.mobile,
        },
      ],
    });
    if (findDuplicateUser) {
      res
        .status(StatusCodes.NOT_ACCEPTABLE)
        .json({ message: "user already register" });
    } else {
      const activationKey = nanoid();
      const userData = new user({
        name: reqData.name,
        username: reqData.username,
        email: reqData.email,
        mobile: reqData.mobile,
        dob: reqData.dob,
        role: reqData.role,
        password: await bcrypt.hash(reqData.password, 10),
        activationCode: activationKey,
        position: reqData.position,
        skill: null,
        address: null,
        state: null,
        country: null,
        // city: null,
        pincode: null,
        isLeaveAllocated: false,
        education: [
          {
            boardName: null,
            passingYear: null,
            marksPercentage: null,
          },
        ],
        workDetail: [
          {
            companyName: null,
            position: null,
            startingYear: null,
            endingYear: null,
          },
        ],

        document: {
          aadharNumber: null,
          voterNumber: null,
          panNumber: null,
          passportNumber: null,
        },
        bankDetails: {
          bankName: null,
          accountNumber: null,
          ifsc: null,
          branchName: null,
        },
        createdBy: reqData.user.username,
        updatedBy: null,
        approvedBy: reqData.user.username,
        activeStatus: true,
        registrationStatus: "waiting",
      });
      const saveUser = await userData.save();

      const createLeaveList = new leave({
        user_id: reqData.username,
        leaveDetail: [
          {
            leaveYear: moment(new Date()).format("YYYY"),
            totalLeaveLeft: (12 - (moment().month() + 1)) * 2,
            totalLeave: (12 - (moment().month() + 1)) * 2,
            leaveUseDetail: [],
            updatedBy: reqData.createdBy,
          },
        ],

        createdBy: reqData.createdBy,
      });

      await createLeaveList.save();
      res.status(StatusCodes.OK).json({
        message: "Activation key created successfully",
        activationKey: saveUser.activationCode,
      });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const activationKeyList = async (req: Request, res: Response) => {
  try {
    const status: any = req.params;
    var activationList: any = [];
    if (status.id === "all") {
      activationList = await user.find().sort({ createdAt: -1 });
    } else {
      activationList = await user
        .find({ registrationStatus: status.id })
        .sort({ createdAt: -1 });
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: activationList });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const checkActivationKey = async (req: Request, res: Response) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const validActivationKey = await user.findOne({
      activationCode: reqData.activationCode,
    });
    if (validActivationKey) {
      res.status(StatusCodes.OK).json({
        message: "Data fetched successfully",
        data: validActivationKey,
      });
    } else {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "invalid activation key" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const userUpdate = async (req: Request, res: Response) => {
  try {
    const reqData: any = Object.assign({}, req.body);

    const validUser = await user.findOne({
      activationCode: reqData.activationCode,
    });
    if (!validUser) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "invalid activation code" });
    }
    if (validUser) {
      let requestData: any = {
        name: reqData.name,
        position: reqData.position,
        skill: reqData.skill,
        address: reqData.address,
        state: reqData.state,
        country: reqData.country,
        // city: reqData.city,
        pincode: reqData.pincode,
        education: reqData.education,
        workDetail: reqData.workDetail,
        document: reqData.document,
        bankDetails: reqData.bankDetails,
        registrationStatus:
          reqData.user.role === "admin" || reqData.user.role === "hr"
            ? "verified"
            : "pending",
        updatedBy: reqData.updatedBy,
        approvedBy:
          reqData.user.role === "admin" || reqData.user.role === "hr"
            ? reqData.user.username
            : null,
        activeStatus: true,
      };

      if (reqData.username) {
        const findDuplicateName: any = await user.findOne({
          username: reqData.username,
        });
        if (findDuplicateName) {
          return res
            .status(StatusCodes.CONFLICT)
            .json({ message: "Username already exists" });
        } else {
          requestData = { ...requestData, username: reqData.username };
        }
      }

      if (reqData.email) {
        const findDuplicateEmail: any = await user.findOne({
          email: reqData.email,
        });
        if (findDuplicateEmail) {
          return res
            .status(StatusCodes.CONFLICT)
            .json({ message: "Email already exists" });
        } else {
          requestData = { ...requestData, email: reqData.email };
        }
      }

      if (reqData.mobile) {
        const findDuplicateMobile: any = await user.findOne({
          mobile: reqData.mobile,
        });
        if (findDuplicateMobile) {
          return res
            .status(StatusCodes.CONFLICT)
            .json({ message: "Mobile Number already exists" });
        } else {
          requestData = { ...requestData, mobile: reqData.mobile };
        }
      }
      await user.updateOne(
        { activationCode: reqData.activationCode },
        {
          $set: requestData,
        }
      );
      return res
        .status(StatusCodes.OK)
        .json({ message: "user update successfully" });
    }
  } catch (error: any) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const forgetPassword = async (req: Request, res: Response) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const validUser = await user.findOne({
      $or: [
        { username: reqData.userId },
        { email: reqData.userId },
        { mobile: reqData.userId },
      ],
    });
    if (validUser) {
      validUser.password = await bcrypt.hash(reqData.password, 10);
      validUser.save();
      res
        .status(StatusCodes.OK)
        .json({ message: "Password change successfully" });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const checkUser: any = await user.findOne({
      $or: [
        { username: reqData.userId },
        { email: reqData.userId },
        { mobile: reqData.userId },
      ],
    });

    if (checkUser) {
      if (
        checkUser.activeStatus === true &&
        checkUser.registrationStatus === "verified"
      ) {
        const verifyPassword = await bcrypt.compare(
          reqData.password,
          checkUser.password
        );
        if (verifyPassword) {
          // const userData = await user.aggregate([
          //   { $match: { _id: checkUser._id } },
          //   { $project: { password: 0 } },
          // ]);

          const userData = await user.findOne(
            {
              _id: checkUser._id,
            },
            { password: 0 }
          );

          const scretKey: any = process.env.secret_Key;
          const token = jwt.sign(
            {
              _id: checkUser._id,
              username: checkUser.username,
              role: checkUser.role,
            },
            scretKey,
            {
              expiresIn: "6h",
            }
          );
          // const userData: any = checkUser.project({ password: 0 });
          // console.log(userData);
          res.status(StatusCodes.OK).json({ user: userData, token: token });
        } else {
          res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ message: "invalid password" });
        }
      } else {
        res
          .status(StatusCodes.NOT_ACCEPTABLE)
          .json({ message: "Pending for Admin Approved" });
      }
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "invalid user" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const activeStatus = async (req: Request, res: Response) => {
  try {
    const validUser = await user.findOne({ username: req.body.username });
    if (!validUser)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "user not found" });
    if (validUser) {
      await user.updateOne(
        { username: req.body.username },
        {
          activeStatus: req.body.activeStatus,
          updatedBy: req.body.user.username,
        }
      );
      return res
        .status(StatusCodes.OK)
        .json({ message: "User status updated successfully" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const userDatatTable = async (req: Request, res: Response) => {
  try {
    const reqData = req.body;
    const page = reqData.page;
    const limit = reqData.limit;
    const start = page * limit - limit;
    const query: any[] = [];
    if (reqData.hasOwnProperty("name")) {
      query.push({ name: { $regex: `^${reqData.name}`, $options: "i" } });
    }
    if (reqData.hasOwnProperty("username")) {
      query.push({ username: reqData.username });
    }
    if (reqData.hasOwnProperty("mobile")) {
      query.push({ mobile: reqData.mobile });
    }
    if (reqData.hasOwnProperty("activationCode")) {
      query.push({ activationCode: reqData.activationCode });
    }
    if (reqData.hasOwnProperty("role")) {
      query.push({
        role: { $regex: `^${reqData.role}`, $options: "i" },
      });
    }
    if (reqData.hasOwnProperty("email")) {
      query.push({ email: reqData.email });
    }
    if (reqData.hasOwnProperty("position")) {
      query.push({
        position: { $regex: `^${reqData.position}`, $options: "i" },
      });
    }
    if (reqData.hasOwnProperty("country")) {
      query.push({
        country: { $regex: `^${reqData.country}`, $options: "i" },
      });
    }
    if (reqData.hasOwnProperty("state")) {
      query.push({
        state: { $regex: `^${reqData.state}`, $options: "i" },
      });
    }
    if (reqData.hasOwnProperty("registrationStatus")) {
      query.push({
        registrationStatus: {
          $regex: `^${reqData.registrationStatus}`,
          $options: "i",
        },
      });
    }
    if (reqData.hasOwnProperty("activeStatus")) {
      query.push({ activeStatus: reqData.activeStatus });
    }

    const data: any[] = await Promise.all([
      user.countDocuments([
        { $match: query.length > 0 ? { $and: query } : {} },
      ]),
      user.aggregate([
        { $match: query.length > 0 ? { $and: query } : {} },
        {
          $sort: reqData.hasOwnProperty("sort")
            ? reqData.sort
            : {
                name: 1,
              },
        },
        { $skip: start },
        { $limit: limit },
      ]),
    ]);

    res.status(StatusCodes.OK).json({
      message: "Data fetched successfully",
      data: data[1],
      count: data[0],
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const userVerified = async (req: Request, res: Response) => {
  try {
    const validUser: any = await user.findOne({
      activationCode: req.body.activationCode,
    });
    if (validUser) {
      await user.updateOne(
        { activationCode: req.body.activationCode },
        {
          approvedBy: req.body.user.username,
          registrationStatus: req.body.registrationStatus,
        }
      );
      return res
        .status(StatusCodes.OK)
        .json({ message: "User Approved successfully" });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "user not found" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const singleUser = async (req: Request, res: Response) => {
  try {
    const id = req.params;
    const findUser: any = await user.findOne(
      { _id: new mongoose.Types.ObjectId(id.id) },
      { password: 0 }
    );
    return res
      .status(StatusCodes.OK)
      .json({ data: findUser, message: "Data fetched successfully" });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export {
  generateActivationKey,
  forgetPassword,
  userUpdate,
  checkActivationKey,
  login,
  activeStatus,
  activationKeyList,
  userDatatTable,
  userVerified,
  singleUser,
};

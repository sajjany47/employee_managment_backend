import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import user from "../model/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

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
        activationCode: activationKey,
        createdBy: reqData.createdBy,
        activeStatus: false,
      });
      const saveUser = await userData.save();
      res.status(StatusCodes.OK).json({
        message: "Activation key created successfully",
        activationKey: saveUser.activationCode,
      });
    }
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
    if (validUser) {
      validUser.password = await bcrypt.hash(reqData.password, 10);
      validUser.address = reqData.address;
      validUser.state = reqData.state;
      validUser.district = reqData.district;
      validUser.city = reqData.city;
      validUser.pincode = reqData.pincode;
      validUser.education = reqData.education;
      validUser.workDetail = reqData.workDetail;
      validUser.document = reqData.document;
      validUser.bankDetails = reqData.bankDetails;

      await validUser.save();
      res.status(StatusCodes.OK).json({ message: "user update successfully" });
    } else {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "invalid activation code" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const forgetPassword = async (req: Request, res: Response) => {
  try {
    const reqData: any = Object.assign({}, req.body);
    const validUser = await user.findOne({
      $or: [
        { username: reqData.username },
        { email: reqData.email },
        { mobile: reqData.mobile },
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
        // { mobile: parseInt(reqData.userId) },
      ],
    });

    if (checkUser) {
      if (checkUser.activeStatus === true) {
        const verifyPassword = await bcrypt.compare(
          reqData.password,
          checkUser.password
        );
        if (verifyPassword) {
          const scretKey: any = process.env.secret_Key;
          const token = jwt.sign({ _id: checkUser._id }, scretKey, {
            expiresIn: "6h",
          });
          // const userData: any = delete checkUser.password;
          res.status(StatusCodes.OK).json({ user: checkUser, token: token });
        } else {
          res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ message: "invalid password" });
        }
      } else {
        res
          .status(StatusCodes.NOT_ACCEPTABLE)
          .json({ message: "user disabled" });
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
    const reqData: any = Object.assign({}, req.body);
    const validUser = await user.findOne({ username: reqData.username });
    if (validUser) {
      validUser.activeStatus = reqData.activeStatus;
      validUser.updatedBy = reqData.updatedBy;
      validUser.save();
      res
        .status(StatusCodes.OK)
        .json({ message: "user status updated successfully" });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "user not found" });
    }
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
};

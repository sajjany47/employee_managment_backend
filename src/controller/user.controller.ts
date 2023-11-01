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
        registrationStatus: "Pending For User Approved",
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
    if (!validUser) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "invalid activation code" });
    }
    if (validUser) {
      const password = await bcrypt.hash(reqData.password, 10);

      await validUser.updateOne(
        { activationCode: reqData.activationCode },
        {
          password: password,
          address: reqData.address,
          state: reqData.state,
          district: reqData.district,
          city: reqData.city,
          pincode: reqData.pincode,
          education: reqData.education,
          workDetail: reqData.workDetail,
          document: reqData.document,
          bankDetails: reqData.bankDetails,
          registrationStatus: "Pending For Admin Approved",
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
        { mobile: reqData.userId },
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
          // const userData: any = checkUser.project({ password: 0 });
          // console.log(userData);
          res.status(StatusCodes.OK).json({ user: checkUser, token: token });
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
          updatedBy: req.body.updatedBy,
          approvedBy: req.body.approvedBy,
          registrationStatus: "Approved",
        }
      );
      return res
        .status(StatusCodes.OK)
        .json({ message: "user status updated successfully" });
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

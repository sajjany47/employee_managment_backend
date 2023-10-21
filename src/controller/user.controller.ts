import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import user from "../model/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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
      const activationKey = `${reqData.substring(
        0,
        2
      )}${reqData.username.substring(2, 2)}${reqData.mobile.substring(
        4,
        3
      )}${reqData.role.substring(0, 1)}${new Date(reqData.dob)
        .toString()
        .substring(0, 2)}${new Date().toString().substring(0, 2)}`;
      const userData = new user({
        name: reqData.name,
        username: reqData.username,
        email: reqData.email,
        mobile: reqData.mobile,
        dob: reqData.dob,
        role: reqData.role,
        activationCode: activationKey,
      });
      const saveUser = await userData.save();
      res.status(StatusCodes.OK).json({
        message: "Activation key created successfully",
        activationKey: saveUser.activationCode,
      });
    }
  } catch (error) {}
};

export { generateActivationKey };

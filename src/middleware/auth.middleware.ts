import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];

    if (typeof authHeader !== "undefined") {
      const token = authHeader && authHeader.split(" ")[1];
      if (token === null) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: "UNAUTHORIZED" });
      }
      const scretKey: any = process.env.secret_Key;
      jwt.verify(token, scretKey, (err: any, user: any) => {
        if (err) {
          res
            .status(StatusCodes.NOT_ACCEPTABLE)
            .json({ message: "Invalid Token Provide" });
        }
        Object.assign(req.body, { _id: user._id });
        next();
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid token" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { auth };

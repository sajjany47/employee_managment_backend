import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authToken = req.header("Authorization");

    if (!authToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Access Denied" });
    }
    const token = authToken.toString().substring(7);
    const scretKey: any = process.env.secret_Key;
    const verified: any = jwt.verify(token, scretKey);
    const user: any = Object.assign(req.body, { user: verified });

    next();

    // if (typeof authHeader !== "undefined") {
    //   const token = authHeader && authHeader.split(" ")[1];
    //   if (token === null) {
    //     res.status(StatusCodes.UNAUTHORIZED).json({ message: "UNAUTHORIZED" });
    //   }
    //   const scretKey: any = process.env.secret_Key;
    //   jwt.verify(token, scretKey, (err: any, user: any) => {
    //     if (err) {
    //       res
    //         .status(StatusCodes.NOT_ACCEPTABLE)
    //         .json({ message: "Invalid Token Provide" });
    //     }
    //     Object.assign(req.body, { _id: user._id });
    //     next();
    //   });
    // } else {
    //   res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid token" });
    // }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { auth };

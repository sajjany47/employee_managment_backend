import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const taskAssign = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

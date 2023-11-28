import { Request, Response } from "express";
import user from "../model/user.model";
import { StatusCodes } from "http-status-codes";

const employeeList = async (req: Request, res: Response) => {
  try {
    const emplpoyeeList = await user.find({ registrationStatus: "all" });

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: employeeList });
  } catch (error: any) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: error.message });
  }
};

export { employeeList };

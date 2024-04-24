import { Request, Response } from "express";
import user from "../model/user.model";
import { StatusCodes } from "http-status-codes";

const employeeList = async (req: Request, res: Response) => {
  try {
    // const emplpoyeeListData = await user.find({ registrationStatus: "all" });
    const emplpoyeeListData = await user
      .find(
        {
          activeStatus: true,
        },
        { username: 1, name: 1 }
      )
      .sort({ createdAt: -1 });

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: emplpoyeeListData });
  } catch (error: any) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: error.message });
  }
};

export { employeeList };

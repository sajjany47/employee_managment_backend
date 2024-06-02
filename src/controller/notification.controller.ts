import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import notify from "../model/notification.model";

const notificationList = async (req: Request, res: Response) => {
  try {
    const userNoti = await notify.find({
      receiver: { $in: [req.body.user.username] },
    });
    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: userNoti });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { notificationList };

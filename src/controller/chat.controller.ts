import { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";
import chat from "../model/chat.model";

const sendMessage = async (req: Request, res: Response) => {
  try {
    const reqData = req.body;
    const sendData = new chat({
      sender: reqData.user.username,
      receiver: reqData.receiver,
      message: reqData.message,
      document: null,
      date: new Date(),
      status: "seen",
    });

    await sendData.save();

    res.status(StatusCodes.OK).json({ message: "message sent successfully" });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const receiveMessage = async (req: Request, res: Response) => {
  try {
    const reqData = req.body;
    const findMessage = await chat.find({
      sender: reqData.user.username,
      receiver: reqData.username,
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

import { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";
import chat from "../model/chat.model";

const sendMessage = async (req: Request, res: Response) => {
  try {
    const reqData = req.body;
    const query = {
      $or: [
        {
          $and: [{ sender: reqData.user.username, receiver: reqData.receiver }],
        },
        {
          $and: [{ receiver: reqData.user.username, sender: reqData.receiver }],
        },
      ],
    };
    const findConnection: any = await chat.find(query);

    if (findConnection.length > 0) {
      const updateMessage = await chat.findOneAndUpdate(query, {
        $push: {
          chat: {
            date: new Date(),
            name: reqData.user.username,
            message: reqData.message,
            document: null,
            status: "seen",
          },
        },
      });

      return res
        .status(StatusCodes.OK)
        .json({ message: "Message sent successfully", data: updateMessage });
    } else {
      const sendData = new chat({
        sender: reqData.user.username,
        receiver: reqData.receiver,
        chat: [
          {
            date: new Date(),
            name: reqData.user.username,
            message: reqData.message,
            document: null,
            status: "seen",
          },
        ],
      });

      await sendData.save();

      res.status(StatusCodes.OK).json({ message: "message sent successfully" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const receiveMessage = async (req: Request, res: Response) => {
  try {
    const reqData = req.body;
    const findChat = await chat.findOne({
      $or: [
        {
          $and: [{ sender: reqData.user.username, receiver: reqData.receiver }],
        },
        {
          $and: [{ receiver: reqData.user.username, sender: reqData.receiver }],
        },
      ],
    });
    if (findChat) {
      return res
        .status(StatusCodes.OK)
        .json({ message: "Chat fetched successfully", data: findChat.chat });
    } else {
      return res
        .status(StatusCodes.OK)
        .json({ message: "Chat fetched successfully", data: [] });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { sendMessage, receiveMessage };

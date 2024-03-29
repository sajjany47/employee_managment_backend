import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import task from "../model/task.model";
import moment from "moment";
import mongoose from "mongoose";

const taskAssign = async (req: Request, res: Response) => {
  try {
    const reqData = req.body;
    const newtask = new task({
      taskSender: req.body.user.username,
      taskReceiver: reqData.taskReceiver,
      taskStartDate: reqData.taskStartDate,
      takDeadline: reqData.takDeadline,
      taskYear: moment(reqData.taskStartDate).format("YYYY"),
      taskDetails: reqData.taskDetails,
      taskProject: reqData.taskProject,
      taskStatus: reqData.taskStatus,
      taskRating: null,
      taskRemark: null,
    });

    const saveData = await newtask.save();
    res
      .status(StatusCodes.OK)
      .json({ message: "Task Assign Successfully", data: saveData });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const taskUpdate = async (req: Request, res: Response) => {
  try {
    const reqData = req.body;

    const updateTask = await task.findOneAndUpdate(
      { _id: reqData.id },
      {
        $set: {
          taskSender: reqData.taskSender,
          taskReceiver: reqData.taskReceiver,
          taskStartDate: reqData.taskStartDate,
          takDeadline: reqData.takDeadline,
          taskYear: moment(reqData.taskStartDate).format("YYYY"),
          taskDetails: reqData.taskDetails,
          taskProject: reqData.taskProject,
          taskStatus: reqData.taskStatus,
          taskRating: reqData.taskRating,
          taskRemark: reqData.taskRemark,
        },
      }
    );

    res
      .status(StatusCodes.OK)
      .json({ message: "Task updated successfully", data: updateTask });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const taskList = async (req: Request, res: Response) => {
  try {
    const reqData = req.query;
    const query: any = {};
    if (reqData.hasOwnProperty("sender")) {
      if (reqData.status === "all") {
        query.taskYear = reqData.year;
        query.taskSender = req.body.user.username;
      } else {
        query.taskYear = reqData.year;
        query.taskSender = req.body.user.username;
        query.taskStatus = reqData.status;
      }
    }
    if (reqData.hasOwnProperty("receiver")) {
      if (reqData.status === "all") {
        query.taskYear = reqData.year;
        query.receiver = req.body.user.username;
      } else {
        query.taskYear = reqData.year;
        query.receiver = req.body.user.username;
        query.taskStatus = reqData.status;
      }
    }

    const result = await task.find(query).sort({ createdAt: -1 });
    return res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: result });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { taskAssign, taskUpdate, taskList };

// http://localhost:8081/employee/api/task/list?sender=sajjany47&year=2024&status=pending
// { sender: 'sajjany47', year: '2024', status: 'pending' }

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import leave from "../model/leave.model";
import moment from "moment";
import user from "../model/user.model";
import mongoose from "mongoose";

const leaveAlloted = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const findUser = await leave.findOne({ user_id: reqData.user_id });
    if (findUser) {
      const findYear = findUser.leaveDetail.find(
        (item) => item.leaveYear === moment(reqData.leaveYear).format("YYYY")
      );
      if (findYear) {
        res
          .status(StatusCodes.CONFLICT)
          .json({ message: "Current Year Leave already allocated" });
      } else {
        const modifyLeave = {
          leaveYear: moment(reqData.leaveYear).format("YYYY"),
          totalLeaveLeft: reqData.leaveAlloted,
          totalLeave: reqData.leaveAlloted,
          leaveUseDetail: [],
          updatedBy: reqData.updatedBy,
        };

        const insertLeave = await leave.updateOne(
          { user_id: reqData.user_id },
          { $push: { leaveDetail: modifyLeave } }
        );

        res.status(StatusCodes.OK).json({
          message: `Current Year (${moment(reqData.leaveYear).format(
            "YYYY"
          )}) leave Allocated successfully`,
        });
      }
    } else {
      const createLeaveList = new leave({
        user_id: reqData.user_id,
        leaveDetail: [
          {
            leaveYear: moment(reqData.leaveYear).format("YYYY"),
            totalLeaveLeft: reqData.leaveAlloted,
            totalLeave: reqData.leaveAlloted,
            leaveUseDetail: [],
          },
        ],

        createdBy: reqData.createdBy,
      });

      const saveLeaveList = await createLeaveList.save();
      if (saveLeaveList) {
        const isLeaveAllocatedUpdate = await user.findOneAndUpdate(
          {
            username: reqData.user_id,
          },
          { $set: { isLeaveAllocated: true } }
        );
      }

      res
        .status(StatusCodes.OK)
        .json({ message: "Leave created successfully", data: saveLeaveList });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const getNewUserList = async (req: Request, res: Response) => {
  try {
    const userList = await user.find(
      {
        isLeaveAllocated: false,
        registrationStatus: "verified",
      },
      { username: 1, _id: 1, name: 1 }
    );
    // .projection({ username: 1, _id: 1, name: 1 });

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: userList });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const leaveList = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const findLeaveList = await leave.aggregate([
      {
        $match: {
          "leaveDetail.leaveYear": id,
        },
      },
      {
        $unwind: {
          path: "$leaveDetail",
        },
      },
    ]);

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: findLeaveList });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const editLeaveAlloctated = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const findUserLeave: any = await leave.findOne({ user_id: reqData._id });
    const filterUser = findUserLeave.leaveDetail.find(
      (item: any) => item.leaveYear === moment(reqData.leaveYear).format("YYYY")
    );
    if (filterUser) {
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { leaveAlloted, getNewUserList, leaveList };

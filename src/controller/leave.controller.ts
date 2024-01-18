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
          updatedBy: reqData.createdBy,
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
            updatedBy: reqData.createdBy,
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
    const year = req.params.year;

    const presentYearUserList = await leave.find(
      {
        "leaveDetail.leaveYear": year,
      }
      // { user_id: 1, _id: 1 }
    );
    const userList = await user.find(
      {
        // isLeaveAllocated: false,
        registrationStatus: "verified",
        activeStatus: true,
      },
      { username: 1, _id: 1, name: 1 }
    );

    const filterData = userList.filter(
      (item1) =>
        !presentYearUserList.some((item2) => item1.username === item2.user_id)
    );

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: filterData });
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

    const findUserLeave: any = await leave.findOneAndUpdate(
      {
        "leaveDetail._id": new mongoose.Types.ObjectId(reqData._id),
      },
      {
        $set: {
          "leaveDetail.$.leaveYear": reqData.leaveYear,
          "leaveDetail.$.totalLeave": reqData.leaveAlloted,
          "leaveDetail.$.updatedBy": reqData.updatedBy,
        },
      }
    );

    res.status(StatusCodes.OK).json({ message: "Leave updated successfully" });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export { leaveAlloted, getNewUserList, leaveList, editLeaveAlloctated };

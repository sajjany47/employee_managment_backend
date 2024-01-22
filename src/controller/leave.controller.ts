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

    const presentYearUserList = await leave.find({
      "leaveDetail.leaveYear": year,
    });
    const userList = await user.find(
      {
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
        $unwind: {
          path: "$leaveDetail",
        },
      },
      {
        $match: {
          "leaveDetail.leaveYear": id,
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

    const responseBody: any = {
      "leaveDetail.$.updatedBy": reqData.updatedBy,
      "leaveDetail.$.totalLeave": reqData.leaveAlloted,
    };

    const findUserLeave: any = await leave.findOneAndUpdate(
      {
        "leaveDetail._id": new mongoose.Types.ObjectId(reqData._id),
      },
      {
        $set: responseBody,
      }
    );

    res.status(StatusCodes.OK).json({ message: "Leave updated successfully" });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const leaveApply = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const startDay = moment(reqData.startDay).format("YYYY-MM-DD");
    const endDay = moment(reqData.endDay).format("YYYY-MM-DD");

    const daysBetween = moment(endDay).diff(startDay, "days");

    const weekends = [];

    for (let i = 0; i < daysBetween; i++) {
      const currentDayOfWeek = moment(startDay).add(i, "days").day();

      if (currentDayOfWeek !== (0 || 6)) {
        weekends.push(moment(startDay).add(i, "days").format("YYYY-MM-DD"));
      }
    }

    if (weekends.length > 0) {
      const findUser = await leave.aggregate([
        {
          $unwind: {
            path: "$leaveDetail",
          },
        },
        {
          $match: {
            $and: [
              { user_id: reqData.user_id },
              {
                "leaveDetail.leaveYear": moment(reqData.startDay).format(
                  "YYYY"
                ),
              },
            ],
          },
        },
        {
          $lookup: {
            from: "holidaylists",
            localField: "leaveDetail.leaveYear",
            foreignField: "holidayYear",
            as: "result",
          },
        },
      ]);

      if (findUser.length > 0) {
        const filterDate: any =
          findUser[0]?.result.length > 0
            ? weekends.filter(
                (item1: any) =>
                  !findUser[0]?.result[0].holidayList.some(
                    (item2: any) =>
                      item1 === moment(item2.holidayDate).format("YYYY-MM-DD")
                  )
              )
            : weekends;

        const totalLeaveUse = findUser[0]?.leaveDetail?.leaveUseDetail.filter(
          (item: any) => item.leaveStatus === "approved"
        );

        const leaveUseUpdate = findUser[0]?.leaveDetail?.leaveUseDetail.concat({
          startDay: new Date(reqData.startDay),
          endDay: new Date(reqData.endDay),
          totalDays: filterDate.length,
          reason: reqData.reason,
          createOn: new Date(),
          leaveStatus: "pending",
          approvedBy: null,
        });

        const updateLeave = await leave.findOneAndUpdate(
          {
            user_id: reqData.user_id,
            "leaveDetail.leaveYear": moment(reqData.startDay).format("YYYY"),
          },

          {
            $set: {
              "leaveDetail.$.totalLeaveLeft":
                findUser[0].leaveDetail.totalLeave - totalLeaveUse.length,
              "leaveDetail.$.leaveUseDetail": leaveUseUpdate,
            },
          }
        );

        return res
          .status(StatusCodes.OK)
          .json({ message: "Leave successfully apply, wait for approved" });
      } else {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "User not leave alloted" });
      }
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Select valid date for leave" });
    }
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const applyLeaveList = async (req: Request, res: Response) => {
  try {
    const reqData = Object.assign({}, req.body);
    const findLeaveList = await leave.aggregate([
      {
        $unwind: {
          path: "$leaveDetail",
        },
      },
      {
        $match: {
          $and: [
            { user_id: reqData.user_id },
            { "leaveDetail.leaveYear": reqData.leaveYear },
          ],
        },
      },
    ]);

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: findLeaveList[0] });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

const userApplyLeaveList = async (req: Request, res: Response) => {
  try {
    const year = req.params.year;
    const leaveList = await leave.aggregate([
      {
        $unwind: {
          path: "$leaveDetail",
        },
      },
      {
        $unwind: {
          path: "$leaveDetail.leaveUseDetail",
        },
      },
      {
        $match: {
          "leaveDetail.leaveYear": year,
          "leaveDetail.leaveUseDetail.leaveStatus": "pending",
        },
      },
    ]);

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: leaveList });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export {
  leaveAlloted,
  getNewUserList,
  leaveList,
  editLeaveAlloctated,
  leaveApply,
  applyLeaveList,
};

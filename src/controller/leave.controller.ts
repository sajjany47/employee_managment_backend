import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import leave from "../model/leave.model";
import moment from "moment";
import user from "../model/user.model";
import mongoose from "mongoose";
import holidayList from "../model/holiday.model";

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
      // if (saveLeaveList) {
      //   const isLeaveAllocatedUpdate = await user.findOneAndUpdate(
      //     {
      //       username: reqData.user_id,
      //     },
      //     { $set: { isLeaveAllocated: true } }
      //   );
      // }

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
    // if (reqData.leaveYear) {
    //   const findUplicateYear = await leave.findOne({
    //     user_id: reqData.user_id,
    //     "leaveDetail.leaveYear": moment(reqData.leaveYear).format("YYYY"),
    //   });
    //   if (findUplicateYear) {
    //     return res.status(StatusCodes.CONFLICT).json({
    //       message: `${moment(reqData.leaveYear).format(
    //         "YYYY"
    //       )} Year Leave already allocated`,
    //     });
    //   } else {
    //     responseBody = {
    //       ...responseBody,
    //       "leaveDetail.$.leaveYear": moment(reqData.leaveYear).format("YYYY"),
    //     };
    //   }
    // }
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
    // const startDayOfWeek = startDay.day();
    // const endDayOfWeek = endDay.day();

    const daysBetween = moment(endDay).diff(startDay, "days");

    const weekends = [];

    for (let i = 0; i < daysBetween; i++) {
      const currentDayOfWeek = moment(startDay).add(i, "days").day();

      if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
        weekends.push(moment(startDay).add(i, "days").format("YYYY-MM-DD"));
      }
    }

    // return weekends

    // for (
    //   let date = startDay.clone();
    //   date.isSameOrBefore(endDay);
    //   date.add(1, "days")
    // ) {
    //   if (date.weekday() !== 6 || date.weekday() !== 0) {
    //     weekends.push(date);
    //   }
    // }

    if (weekends.length > 0) {
      // const findHoliday = await holidayList.findOne({
      //   holidayYear: moment(reqData.startDay).format("YYYY"),
      // });
      // const a: any =
      //   findHoliday === undefined || findHoliday === null
      //     ? []
      //     : findHoliday.holidayList;

      // const filterDate = weekends.filter(
      //   (item1) =>
      //     !a.some(
      //       (item2: any) =>
      //         moment(item1).format("YYYY") ===
      //         moment(item2.holidayDate).format("YYYY")
      //     )
      // );

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

        {
          $unwind: {
            path: "$result",
          },
        },
      ]);

      const filterDate: any = weekends.filter(
        (item1: any) =>
          !findUser[0]?.result?.holidayList.some(
            (item2: any) =>
              moment(item1).format("YYYY") ===
              moment(item2.holidayDate).format("YYYY")
          )
      );

      const totalLeaveUse = findUser[0].leaveDetail.leaveUseDetail.filter(
        (item: any) => item.leaveStatus === "approved"
      );

      const updateLeave = await leave.findOneAndUpdate(
        {
          user_id: reqData.user_id,
          "leaveDetail.leaveYear": moment(reqData.startDay).format("YYYY"),
        },
        {
          $set: {
            "leaveDetail.$.totalLeaveLeft":
              findUser[0].leaveDetail.totalLeave - totalLeaveUse.length,
            $push: {
              "leaveDetail.$.leaveUseDetail": {
                startDay: new Date(reqData.startDay),
                endDay: new Date(reqData.endDay),
                totalDays: filterDate.length,
                reason: reqData.reason,
                leaveStatus: "pending",
                approvedBy: null,
              },
            },
          },
        }
      );

      res
        .status(StatusCodes.OK)
        .json({ message: "Leave successfully apply, wait for approved" });
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Select valid date for leave" });
    }
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
};

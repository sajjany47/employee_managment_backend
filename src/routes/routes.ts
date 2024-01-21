import express from "express";
import {
  activationKeyList,
  activeStatus,
  checkActivationKey,
  forgetPassword,
  generateActivationKey,
  login,
  singleUser,
  userDatatTable,
  userUpdate,
  userVerified,
} from "../controller/user.controller";
import { auth } from "../middleware/auth.middleware";
import { multiUserLeaveAdd, timeData } from "../controller/timeData.controller";
import { employeeList } from "../controller/employee.controller";
import {
  createHolidayList,
  deleteHolidayList,
  holidayListData,
  // holidayListData,
} from "../controller/holiday.controller";
import {
  applyLeaveList,
  editLeaveAlloctated,
  getNewUserList,
  leaveAlloted,
  leaveApply,
  leaveList,
} from "../controller/leave.controller";

const routes = express.Router();
routes.route("/sigin").post(login);
routes.route("/activation-code").post(auth, generateActivationKey);
routes.route("/check-activation-key").post(checkActivationKey);
routes.route("/user-update").post(auth, userUpdate);
routes.route("/user-verified").post(auth, userVerified);
routes.route("/single-user/:id").get(auth, singleUser);
routes.route("/forget-password").post(forgetPassword);
routes.route("/change-status").post(auth, activeStatus);
routes.route("/activation-key-list/:id").get(auth, activationKeyList);
routes.route("/employee-list").get(auth, employeeList);
routes.route("/holiday-list/:id").get(auth, holidayListData);
routes.route("/create-holiday").post(auth, createHolidayList);
routes.route("/delete-holiday").post(auth, deleteHolidayList);
routes.route("/single-user/leave-create").post(auth, leaveAlloted);
routes.route("/userlist/leave/:year").get(getNewUserList);
routes.route("/leave-alloted-list/:id").get(auth, leaveList);
routes.route("/leave-apply").post(auth, leaveApply);
routes.route("/leave-apply-list").post(auth, applyLeaveList);
routes.route("/leave-alloted/edit").post(auth, editLeaveAlloctated);
routes.route("/multi-user/leave-add").post(multiUserLeaveAdd);
routes.route("/time-record").post(auth, timeData);
routes.route("/user-datatable").post(auth, userDatatTable);

export default routes;

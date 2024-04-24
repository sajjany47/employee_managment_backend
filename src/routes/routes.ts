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
import {
  attendanceList,
  inValidAttendanceChange,
  multiUserLeaveAdd,
  userAttendanceDetails,
  userDailyCheck,
  userInvalidAttendance,
  userTimeData,
} from "../controller/timeData.controller";
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
  userApplyLeaveApproved,
  userApplyLeaveList,
} from "../controller/leave.controller";

import {
  salaryList,
  salaryUserAlloted,
  singleUserList,
  userSalaryCreate,
} from "../controller/salary.controller";
import {
  generatePayroll,
  payrollListMonthWise,
  payrollUpdate,
  salarySlipDownload,
  salarySlipGenerate,
  singleUserPayrollList,
} from "../controller/payroll.controller";
import {
  taskAssign,
  taskList,
  taskUpdate,
} from "../controller/task.controller";
import { notificationList } from "../controller/notification.controller";
import { receiveMessage, sendMessage } from "../controller/chat.controller";

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
routes.route("/userlist/leave/:year").get(auth, getNewUserList);
routes.route("/leave-alloted-list/:id").get(auth, leaveList);
routes.route("/leave-apply").post(auth, leaveApply);
routes.route("/leave-apply-list").post(auth, applyLeaveList);
routes.route("/leave-apply-list/:year").get(auth, userApplyLeaveList);
routes.route("/leave-approved").post(auth, userApplyLeaveApproved);
routes.route("/leave-alloted/edit").post(auth, editLeaveAlloctated);
routes.route("/time-record").post(auth, userTimeData);
routes.route("/date-check").post(auth, userDailyCheck);
routes.route("/user-attendance/details").post(auth, userAttendanceDetails);
routes
  .route("/user-invalid-attendance/details")
  .get(auth, userInvalidAttendance);
routes.route("/invalid-attendance/change").post(auth, inValidAttendanceChange);
routes.route("/time-record/list").post(attendanceList);
routes.route("/salary/structure-create").post(auth, userSalaryCreate);
routes.route("/salary/user-list").get(auth, salaryUserAlloted);
routes.route("/salary/list").get(auth, salaryList);
routes.route("/salary/list/:id").get(auth, singleUserList);
routes.route("/salary-slip/generate").post(auth, salarySlipGenerate);
routes.route("/payroll/generate").post(auth, generatePayroll);
routes.route("/payroll/update").post(auth, payrollUpdate);
routes.route("/payroll/month/list").post(auth, payrollListMonthWise);
routes.route("/payroll/user/list").post(auth, singleUserPayrollList);
routes.route("/salary-slip/download").post(auth, salarySlipDownload);
routes.route("/task/create").post(auth, taskAssign);
routes.route("/task/update").post(auth, taskUpdate);
routes.route("/task/list").get(auth, taskList);
routes.route("/chat/send").post(auth, sendMessage);
routes.route("/chat/receive").post(auth, receiveMessage);
routes.route("/notification").get(auth, notificationList);
routes.route("/multi-user/leave-add").post(multiUserLeaveAdd);
routes.route("/user-datatable").post(auth, userDatatTable);

export default routes;

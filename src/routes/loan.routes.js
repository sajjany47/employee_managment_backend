import express from "express";
import { tokenValidation } from "../middleware/auth.middleware.js";
import {
  ApplicationCreate,
  applicationDelete,
  ApplicationUpdate,
  datatable,
  documentDelete,
  documentUpdate,
  documentUpload,
  getEMIDetails,
  getLoanDetail,
  LeadAssignAgent,
  LeadBulkUpload,
} from "../api/loan/loan.controller.js";
import {
  AddRemarkAgent,
  AgentList,
  ApplicationView,
  LoanManagList,
  LoanPay,
  PaidLoanList,
  PaymentDetails,
  RemarkDetails,
} from "../api/loan/managment.controller.js";

const LoanRoutes = express.Router();

LoanRoutes.route("/application-create").post(
  tokenValidation,
  ApplicationCreate
);
LoanRoutes.route("/application-update").post(
  tokenValidation,
  ApplicationUpdate
);
LoanRoutes.route("/application-document").post(tokenValidation, documentUpload);
LoanRoutes.route("/document-update").post(tokenValidation, documentUpdate);
LoanRoutes.route("/document-delete").post(tokenValidation, documentDelete);
LoanRoutes.route("/application-delete").post(
  tokenValidation,
  applicationDelete
);
LoanRoutes.route("/:id").get(tokenValidation, getLoanDetail);
LoanRoutes.route("/emi-details").post(tokenValidation, getEMIDetails);
LoanRoutes.route("/manage/list").post(tokenValidation, LoanManagList);
LoanRoutes.route("/manage/branch-agent/:id").get(tokenValidation, AgentList);
LoanRoutes.route("/manage/remark/:id").get(tokenValidation, RemarkDetails);
LoanRoutes.route("/manage/remark-agent-update").post(
  tokenValidation,
  AddRemarkAgent
);
LoanRoutes.route("/manage/pay").post(tokenValidation, LoanPay);
LoanRoutes.route("/manage/payment").post(tokenValidation, PaymentDetails);
LoanRoutes.route("/manage/paid-list").post(tokenValidation, PaidLoanList);
LoanRoutes.route("/application-view/:id").get(tokenValidation, ApplicationView);
LoanRoutes.route("/datatable").post(tokenValidation, datatable);
LoanRoutes.route("/lead/bulk-upload").post(tokenValidation, LeadBulkUpload);
LoanRoutes.route("/lead/assign-agent").post(tokenValidation, LeadAssignAgent);

export default LoanRoutes;

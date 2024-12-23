import express from "express";
import { tokenValidation } from "../middleware/auth.middleware.js";
import {
  downloadInvestorExcelFile,
  financeCreate,
  financeGetDetails,
  financePayNow,
  financeReedemApply,
  financeUpdate,
  insertManyWithExcel,
  InvestorDatatable,
  MaturedDatatable,
  PayoutDatable,
  readInvestorExcelFile,
  ReedemDatable,
} from "../api/Finance/Finance.controller.js";

const FinaceRoutes = express.Router();

FinaceRoutes.route("/create").post(tokenValidation, financeCreate);
FinaceRoutes.route("/update").post(tokenValidation, financeUpdate);
FinaceRoutes.route("/:id").get(tokenValidation, financeGetDetails);
FinaceRoutes.route("/pay-now").post(tokenValidation, financePayNow);
FinaceRoutes.route("/reedem-apply").post(tokenValidation, financeReedemApply);
FinaceRoutes.route("/investor/datatable").post(
  tokenValidation,
  InvestorDatatable
);
FinaceRoutes.route("/payout/datatable").post(tokenValidation, PayoutDatable);
FinaceRoutes.route("/matured/datatable").post(
  tokenValidation,
  MaturedDatatable
);
FinaceRoutes.route("/reedem/datatable").post(tokenValidation, ReedemDatable);
FinaceRoutes.route("/investor/download-excel").get(
  tokenValidation,
  downloadInvestorExcelFile
);
FinaceRoutes.route("/investor/read-excel").post(
  tokenValidation,
  readInvestorExcelFile
);

FinaceRoutes.route("/investor/insert/excel").post(
  tokenValidation,
  insertManyWithExcel
);

export default FinaceRoutes;

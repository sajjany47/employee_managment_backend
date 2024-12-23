import express from "express";
import { tokenValidation } from "../middleware/auth.middleware.js";
import {
  financialReport,
  loanPerformance,
} from "../api/report/report.controller.js";

const ReportRoutes = express.Router();

ReportRoutes.route("/financial-year/invest").post(
  tokenValidation,
  financialReport
);
ReportRoutes.route("/financial-year/loan").post(
  tokenValidation,
  loanPerformance
);

export default ReportRoutes;

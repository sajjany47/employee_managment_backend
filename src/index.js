import { createServer } from "http";
import mongoose from "mongoose";
import express from "express";
import fileUpload from "express-fileupload";
import cors from "cors";
import BranchRoutes from "./routes/branch.routes.js";
import EmployeeRoutes from "./routes/employee.routes.js";
import RegionalRoutes from "./routes/regional.routes.js";
import LoanRoutes from "./routes/loan.routes.js";
import DocumentRoutes from "./routes/dcoument.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import ChargesRoutes from "./routes/charges.routes.js";
import FinaceRoutes from "./routes/finance.routes.js";
import ReportRoutes from "./routes/report.routes.js";
import AccessRoutes from "./routes/access.routes.js";

function main() {
  const port = process.env.port;
  const mongodb_url = process.env.mongodb_url;

  // Get __filename and __dirname for ES Modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const app = express();
  app.use(
    fileUpload({
      useTempFiles: false,
    })
  );
  const server = createServer(app);
  app.use(express.json({ limit: "100mb" }));
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError) {
      return res.status(400).json({
        error: "Invalid JSON",
        message:
          "The provided JSON is not correctly formatted. Please check your JSON syntax.",
      });
    }

    next(err);
  });
  // Serve static files (like images) from the './src/uploads' directory
  app.use("/uploads", express.static(path.join(__dirname, "../../Upload/")));

  app.use(express.urlencoded({ limit: "100mb", extended: true }));
  mongoose
    .connect(mongodb_url)
    .then(() => {
      server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch((e) => console.log(e));

  app.use(
    cors({
      origin: "*",
      // origin: "http://localhost:5173",
      // methods: ["GET", "POST"],
      // credentials: true,
    })
  );

  app.use("/user", EmployeeRoutes);
  app.use("/branch", BranchRoutes);
  app.use("/regional", RegionalRoutes);
  app.use("/loan", LoanRoutes);
  app.use("/document", DocumentRoutes);
  app.use("/charges", ChargesRoutes);
  app.use("/finance", FinaceRoutes);
  app.use("/report", ReportRoutes);
  app.use("/access", AccessRoutes);
}
main();

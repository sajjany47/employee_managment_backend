import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import routes from "./routes/routes";
const port = 8081;

function main() {
  const app = express();
  const corsOptions = {
    origin: "http://localhost:8081",
  };
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ limit: "30 mb", extended: true }));
  app.use(cors(corsOptions));
  app.use("/employee/api", routes);
  mongoose
    .connect(
      // "mongodb+srv://sajjany47:s%40JJAN888@cluster0.g6om3i4.mongodb.net/employee?retryWrites=true&w=majority",
      "mongodb://localhost:27017/employee"
    )
    .then(() => {
      console.log("Database Connected Successfully");
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch((e: any) => console.log(e));
}

main();

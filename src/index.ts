import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
const port = 8081;

function main() {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ limit: "30 mb", extended: true }));
  app.use(cors());
  mongoose
    .connect(
      "mongodb+srv://sajjany47:s%40JJAN888@cluster0.g6om3i4.mongodb.net/employee?retryWrites=true&w=majority"
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

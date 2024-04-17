import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import routes from "./routes/routes";
import cookiesession from "cookie-session";
import http from "http";
import { Server } from "socket.io";

function main() {
  const port = process.env.PORT || 8081;
  const mongodb_url: any = process.env.mongodb_url;
  const cookieSecretKey: any = process.env.COOKIE_SECRET;
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  // const corsOptions = {
  //   origin: "http://localhost:8081",
  // };
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ limit: "30 mb", extended: true }));
  app.use(cors());
  app.use("/employee/api", routes);
  app.use(
    cookiesession({
      name: "employee-session",
      keys: [cookieSecretKey],
      httpOnly: true,
    })
  );

  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("chat message", (msg) => {
      io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
  mongoose
    .connect(mongodb_url)
    .then(() => {
      console.log("Database Connected Successfully");
      server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch((e: any) => console.log(e));
}

main();

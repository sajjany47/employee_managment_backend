import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import routes from "./routes/routes";
import cookiesession from "cookie-session";
import { createServer } from "http";
import { Server } from "socket.io";

function main() {
  const port = process.env.PORT || 8081;
  const mongodb_url: any = process.env.mongodb_url;
  const cookieSecretKey: any = process.env.COOKIE_SECRET;
  const app = express();
  // const corsOptions = {
  //   origin: "http://localhost:8081",
  // };
  const server = createServer(app);
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log(socket);

    socket.on("sendNotification", (data) => {
      console.log("Notification received:", data);

      io.emit("receiveNotification", data);
    });
    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });

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

import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import routes from "./routes/routes";
import cookiesession from "cookie-session";
import { Server } from "socket.io";
import { createServer } from "http";

function main() {
  const port = process.env.PORT || 8081;
  const mongodb_url: any = process.env.mongodb_url;
  const cookieSecretKey: any = process.env.COOKIE_SECRET;
  const app: any = express();
  const server: any = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // const corsOptions = {
  //   origin: "http://localhost:8081",
  // };
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ limit: "30 mb", extended: true }));
  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    })
  );
  app.use("/employee/api", routes);
  app.use(
    cookiesession({
      name: "employee-session",
      keys: [cookieSecretKey],
      httpOnly: true,
    })
  );

  io.on("connection", (socket) => {
    socket.on("joinRoom", (user) => {
      socket.join(user.room);
    });

    socket.on("sendMessage", async (message) => {
      // ... (same as previous snippet)
      socket.to(message.receiver).emit("receiveMessage", message);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
  mongoose
    .connect(mongodb_url)
    .then(() => {
      server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch((e: any) => console.log(e));
}

main();

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
  // Store users and their sockets
  const users: any = {};

  io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    socket.on("user:join", (username) => {
      users[username] = socket.id;
      console.log(`User ${username} joined with socket ID ${socket.id}`);
    });
    socket.on("message:send", (data) => {
      const { recipient, message, sender } = data;
      const recipientSocketId = users[recipient];

      if (recipientSocketId) {
        // Recipient is online
        io.to(recipientSocketId).emit("message:receive", { message, sender });
      } else {
        // Store message for offline users (in a real-world scenario, you'd use a database)
        console.log(
          `User ${recipient} is offline. Message from ${sender}: ${message}`
        );
      }
    });
    socket.on("disconnect", () => {
      // Remove user from users object on disconnect
      for (const username in users) {
        if (users[username] === socket.id) {
          delete users[username];
          console.log(`User ${username} disconnected`);
          break;
        }
      }
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

import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import routes from "./routes/routes";
import cookiesession from "cookie-session";
import { Server } from "socket.io";
import { createServer } from "http";
import cron from "node-cron";
import { generatePayrollMonthly } from "./utility/utility";
import fileUpload from "express-fileupload";

function main() {
  const port = process.env.PORT || 8081;
  const mongodb_url: any = process.env.mongodb_url;
  const cookieSecretKey: any = process.env.COOKIE_SECRET;
  const app: any = express();
  app.use(fileUpload());
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

  // io.on("connection", (socket) => {
  //   socket.on("joinRoom", (user) => {
  //     socket.join(user.room);
  //   });

  //   socket.on("sendMessage", async (message) => {
  //     // ... (same as previous snippet)
  //     socket.to(message.receiver).emit("receiveMessage", message);
  //   });

  //   socket.on("disconnect", () => {
  //     console.log("A user disconnected");
  //   });
  // });

  const users: any = {}; // Store connected users and their socket IDs

  io.on("connection", (socket) => {
    console.log("New client connected");

    // Store user and their socket ID
    socket.on("register", (userId) => {
      users[userId] = socket.id;
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          break;
        }
      }
      console.log("Client disconnected");
    });

    // Handle sending notification to a specific user
    socket.on("sendNotification", ({ recipientId, message }) => {
      const recipientSocketId = users[recipientId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("notification", message);
      }
    });
  });
  mongoose
    .connect(mongodb_url)
    .then(() => {
      server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
      cron.schedule("0 0 1 * *", () => {
        generatePayrollMonthly(new Date());
      });
    })
    .catch((e: any) => console.log(e));
}

main();

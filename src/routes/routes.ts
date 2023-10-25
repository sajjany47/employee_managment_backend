import express from "express";
import {
  activeStatus,
  checkActivationKey,
  forgetPassword,
  generateActivationKey,
  login,
  userUpdate,
} from "../controller/user.controller";
import { auth } from "../middleware/auth.middleware";

const routes = express.Router();
routes.route("/sigin").post(login);
routes.route("/activation-code").post(generateActivationKey);
routes.route("/check-activation-key").post(checkActivationKey);
routes.route("/user-update").post(userUpdate);
routes.route("/forget-password").post(forgetPassword);
routes.route("/change-status").post(auth, activeStatus);

export default routes;

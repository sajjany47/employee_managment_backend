import express from "express";
import {
  checkActivationKey,
  forgetPassword,
  generateActivationKey,
  login,
  userUpdate,
} from "../controller/user.controller";

const routes = express.Router();
routes.route("/sigin").post(login);
routes.route("/activation-code").post(generateActivationKey);
routes.route("/check-activation-key").post(checkActivationKey);
routes.route("/user-update").post(userUpdate);
routes.route("/forget-password").post(forgetPassword);

export default routes;

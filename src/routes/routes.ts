import express from "express";
import { generateActivationKey } from "../controller/user.controller";

const routes = express.Router();
routes.route("/activation-code").post(generateActivationKey);

export default routes;

import express from "express";
import { generateActivationKey } from "../controller/user.controller";

function routes() {
  const router = express.Router();
  router.route("/activation-code").post(generateActivationKey);
}

export default routes;

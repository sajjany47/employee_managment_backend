import express from "express";
import { tokenValidation } from "../middleware/auth.middleware.js";
import {
  ChildMenuCreate,
  ChildMenuList,
  ChildMenuUpdate,
  MenuList,
  PrimaryMenuCreate,
  PrimaryMenuUpdate,
} from "../api/access-control/accessControl.controller.js";
import {
  PositionCreate,
  PositionList,
  PositionUpdate,
} from "../api/access-control/position.controller.js";

const AccessRoutes = express.Router();

AccessRoutes.route("/prime-menu/create").post(
  tokenValidation,
  PrimaryMenuCreate
);
AccessRoutes.route("/prime-menu/update").post(
  tokenValidation,
  PrimaryMenuUpdate
);
AccessRoutes.route("/child-menu/create").post(tokenValidation, ChildMenuCreate);
AccessRoutes.route("/child-menu/update").post(tokenValidation, ChildMenuUpdate);
AccessRoutes.route("/prime-menu/list").get(tokenValidation, MenuList);
AccessRoutes.route("/child-menu/list").get(tokenValidation, ChildMenuList);
AccessRoutes.route("/position/create").post(tokenValidation, PositionCreate);
AccessRoutes.route("/position/update").post(tokenValidation, PositionUpdate);
AccessRoutes.route("/position/list").get(tokenValidation, PositionList);

export default AccessRoutes;

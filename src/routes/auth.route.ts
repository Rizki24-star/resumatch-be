import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.post("/google", authController.googleAuth);
router.get("/me", authenticate, authController.getMe);

export default router;

import express from "express";
import { trackEvent } from "../controllers/trackingController.js";
const router = express.Router();

router.post("/", trackEvent);

export default router;

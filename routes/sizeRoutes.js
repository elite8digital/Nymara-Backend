import express from "express";
import { sendQueryEmail } from "../controllers/contactController.js"; // ✅ added .js

const router = express.Router();

router.post("/query", sendQueryEmail);

export default router;

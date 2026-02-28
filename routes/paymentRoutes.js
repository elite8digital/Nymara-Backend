// import express from "express";
// import { createRazorpayOrder, verifyPayment } from "../controllers/paymentController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // 👤 User routes
// router.post("/create-razorpay-order", protect, createRazorpayOrder);
// router.post("/verify-payment", protect, verifyPayment);

// export default router;


import express from "express";
import { createRazorpayOrder, verifyPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

//  User routes
router.post("/create-razorpay-order", protect, createRazorpayOrder);
router.post("/verify-payment", protect, verifyPayment);

export default router;


// models/TrackingLog.js
import mongoose from "mongoose";

const trackingLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  sessionId: { type: String },
  event: {
    type: String,
    enum: ["visit", "add_to_cart", "checkout", "purchase"],
    required: true,
  },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Ornament" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "UserOrder" },
  metadata: { type: Object },
  timestamp: { type: Date, default: Date.now },

  // 🌍 Geo fields
  ip: { type: String },
  country: { type: String },
  region: { type: String },
  city: { type: String },
});

export default mongoose.model("TrackingLog", trackingLogSchema);

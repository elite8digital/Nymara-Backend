// models/TrackingLog.js
import mongoose from "mongoose";

const trackingLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    sessionId: { type: String, index: true },

    // ✅ Expanded, consistent event naming
    event: {
      type: String,
      enum: [
        "visit",
        "view_product",
        "add_to_cart",
        "remove_from_cart",
        "wishlist_add",
        "wishlist_remove",
        "checkout",
        "purchase",
        "share",
        "drop_hint",
      ],
      required: true,
      index: true,
    },

    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Ornament" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "UserOrder" },
    metadata: { type: Object, default: {} },

    eventTimestamp: { type: Date, default: Date.now, index: true },

    ip: { type: String },
    country: { type: String, index: true },
    region: { type: String },
    city: { type: String },

    platform: { type: String, enum: ["web", "mobile", "api"], default: "web" },
  },
  { timestamps: true }
);

// ✅ Smart indexes for analytics
trackingLogSchema.index({ eventTimestamp: 1, event: 1 });
trackingLogSchema.index({ country: 1, event: 1 });
trackingLogSchema.index({ userId: 1, event: 1 });

export default mongoose.model("TrackingLog", trackingLogSchema);

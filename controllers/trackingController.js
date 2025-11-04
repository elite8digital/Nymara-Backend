import TrackingLog from "../models/TrackingLog.js";

export const trackEvent = async (req, res) => {
  try {
    const { event, productId, orderId, metadata } = req.body;

    // ✅ FIXED: no cookies, only use header-based session tracking
    const sessionId = (req.headers && req.headers["x-session-id"]) || null;

    const userId = req.user ? req.user._id : null; // if logged in

    if (!event) {
      return res.status(400).json({ success: false, message: "Event is required" });
    }

      const { country, region, city } = metadata || {};

    await TrackingLog.create({
      event,
      productId,
      orderId,
      metadata,
      sessionId,
      userId,
      country,
      region,
      city,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ success: false, message: "Tracking failed" });
  }
};

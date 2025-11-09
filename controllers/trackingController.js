// controllers/analyticsController.js or controllers/trackingController.js
import TrackingLog from "../models/TrackingLog.js";

export const trackEvent = async (req, res) => {
  try {
    const { event, productId, orderId, metadata } = req.body;

    // ✅ Secure, stateless session tracking
    const sessionId = req.headers["x-session-id"]?.trim() || null;

    // ✅ Get user ID if authenticated (via middleware)
    const userId = req.user ? req.user._id : null;

    // ✅ Validate event name
    if (!event) {
      return res.status(400).json({
        success: false,
        message: "Event type is required",
      });
    }

    // ✅ Clean up metadata (ensure object format)
    const cleanMetadata = typeof metadata === "object" && metadata !== null ? metadata : {};

    // ✅ Get geo details from middleware (auto-enriched)
    const { country, region, city } = req.geo || {};

    // ✅ Optional platform info (frontend can send "web", "mobile", etc.)
    const platform = cleanMetadata.platform || "web";

    // ✅ Create tracking log entry
    await TrackingLog.create({
      event,
      productId: productId || null,
      orderId: orderId || null,
      metadata: cleanMetadata,
      sessionId,
      userId,
      country: country || cleanMetadata.country || "Unknown",
      region: region || cleanMetadata.region || null,
      city: city || cleanMetadata.city || null,
      platform,
      eventTimestamp: new Date(), // important for monthly analytics
    });

    // ✅ Success response
    res.status(201).json({ success: true, message: "Event tracked successfully" });
  } catch (err) {
    console.error("❌ Tracking error:", err);
    res.status(500).json({ success: false, message: "Tracking failed" });
  }
};

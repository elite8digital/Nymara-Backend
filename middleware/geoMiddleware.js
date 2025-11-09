// middlewares/geoMiddleware.js
import geoip from "geoip-lite";

export const geoMiddleware = (req, res, next) => {
  try {
    const forwarded = req.headers["x-forwarded-for"];
    let ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;

    // ✅ Detect localhost / private network and replace with dummy IP for testing
    if (
      ip === "::1" || 
      ip === "127.0.0.1" || 
      ip.startsWith("192.168.") || 
      ip.startsWith("10.")
    ) {
      ip = "122.160.0.1"; // 🔹 Example India IP (you can change this)
    }

    const geo = geoip.lookup(ip);

    if (geo) {
      req.geo = {
        ip,
        country: geo.country || "Unknown",
        region: geo.region || null,
        city: geo.city || null,
      };
    } else {
      req.geo = { ip, country: "Unknown", region: null, city: null };
    }
  } catch (err) {
    console.error("🌍 GeoIP middleware error:", err.message);
    req.geo = { ip: null, country: "Unknown", region: null, city: null };
  }

  next();
};

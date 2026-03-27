import express from "express";
import sendEmail from "../emailer/sendEmail.js"; // ✅ reuse your utility

const router = express.Router();

router.post("/book", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      preferredDate,
      preferredTime,
      timezone,
      appointmentType,
      message,
    } = req.body;

    // ✅ Validate required fields
    if (!name || !email || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, email, date, time)",
      });
    }

    // ✅ Admin email
    const adminHtmlMessage = `
      <h2>📅 New Virtual Appointment Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "Not Provided"}</p>
      <hr/>
      <p><strong>Appointment Type:</strong> ${appointmentType || "Consultation"}</p>
      <p><strong>Date:</strong> ${preferredDate}</p>
      <p><strong>Time:</strong> ${preferredTime}</p>
      <p><strong>Timezone:</strong> ${timezone || "Not Specified"}</p>
      <p><strong>Message:</strong> ${message || "N/A"}</p>
    `;

    // ✅ User confirmation email
    const userHtmlMessage = `
      <h3>Thank you, ${name}!</h3>
      <p>We’ve received your virtual appointment request. Here are your details:</p>
      <ul>
        <li><b>Type:</b> ${appointmentType || "Consultation"}</li>
        <li><b>Date:</b> ${preferredDate}</li>
        <li><b>Time:</b> ${preferredTime} (${timezone || "Your local time"})</li>
      </ul>
      <p>📩 You’ll receive a Microsoft Teams link 24 hours before your appointment.</p>
      <p>- Nymara Jewels Team ✨</p>
    `;

    // ✅ Send to Admin
    await sendEmail({
      email: "jenasaisubham@gmail.com",
      subject: `📅 New Appointment - ${name}`,
      message: adminHtmlMessage,
    });

    // ✅ Send confirmation to User
    await sendEmail({
      email:"jenasaisubham8@gmail.com",
      subject: "✅ Your Virtual Appointment Request",
      message: userHtmlMessage,
    });

    res.json({ success: true, message: "Appointment request sent successfully" });
  } catch (error) {
    console.error("❌ Failed to send appointment request:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send appointment request",
    });
  }
});

export default router;

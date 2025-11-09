import sendEmail from "../emailer/sendEmail.js";

export const sendQueryEmail = async (req, res) => {
  try {
    const { name, email, size, message, productId, productName, productUrl } = req.body;

    // ✅ Basic validation
    if (!email || !productId || !productName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (email, productId, or productName)",
      });
    }

    // ✅ Email subject
    const subject = `💬 Product Query: ${productName}`;

    // ✅ Email HTML content
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color:#9a8457;">Customer Product Query</h2>
        <p><strong>Product Name:</strong> ${productName}</p>
        <p><strong>Product ID:</strong> ${productId}</p>
        <p><strong>Product Link:</strong> <a href="${productUrl}" target="_blank">${productUrl}</a></p>

        <hr/>
        <p><strong>Preferred Size:</strong> ${size || "Not specified"}</p>
        <p><strong>Message:</strong></p>
        <p>${message || "No message provided."}</p>

        <hr/>
        <p><strong>Customer Email:</strong> ${email}</p>
        ${name ? `<p><strong>Name:</strong> ${name}</p>` : ""}
        <p>📅 <em>Sent on ${new Date().toLocaleString()}</em></p>
      </div>
    `;

    // ✅ Send email to admin (and optional CC to customer)
    await sendEmail({
      email: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER, // destination
      subject,
      message: htmlMessage,
    });

    // ✅ Optional confirmation email to user
    await sendEmail({
      email,
      subject: `✅ We received your query for ${productName}`,
      message: `
        <div style="font-family: Arial, sans-serif;">
          <p>Hi ${name || "there"},</p>
          <p>Thank you for reaching out to us regarding <strong>${productName}</strong>.</p>
          <p>Our team will get back to you soon with more details.</p>
          <hr/>
          <p><em>Your query summary:</em></p>
          <ul>
            ${size ? `<li>Preferred Size: ${size}</li>` : ""}
            ${message ? `<li>Message: ${message}</li>` : ""}
            <li><a href="${productUrl}" target="_blank">Product Link</a></li>
          </ul>
          <p>Best,<br/>Team Nymara</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "✅ Query email sent successfully!",
    });
  } catch (error) {
    console.error("❌ Query email error:", error);
    res.status(500).json({
      success: false,
      message: "Email sending failed. Please try again later.",
    });
  }
};

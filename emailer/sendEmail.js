import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    try {
        console.log("📧 [EMAIL] Attempting to send email to:", options.email);
        console.log("📧 [EMAIL] Using EMAIL_USER:", process.env.EMAIL_USER);
        
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            // Additional Gmail configuration for better reliability
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify transporter configuration
        await transporter.verify();
        console.log("✅ [EMAIL] SMTP connection verified successfully");

        const message = {
            from: `Nymara <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.message,
            attachments: options.attachments || [],
        };

        const info = await transporter.sendMail(message);
        console.log('✅ [EMAIL] Message sent successfully! Message ID:', info.messageId);
        console.log('✅ [EMAIL] Accepted recipients:', info.accepted);
        
        return info; // Return the info object
    } catch (error) {
        console.error("❌ [EMAIL] Email sending failed!");
        console.error("❌ [EMAIL] Error message:", error.message);
        console.error("❌ [EMAIL] Error code:", error.code);
        console.error("❌ [EMAIL] Full error:", error);
        throw new Error(`Email could not be sent: ${error.message}`);
    }
};

export default sendEmail;
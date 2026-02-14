// controllers/passwordController.js
import crypto from "crypto";
import UserModel from "../models/User.js";
import sendEmail from "./sendEmail.js";

// Forgot password
export const forgetPassword = async (req, res) => {
  let user;
  try {
    console.log("🔐 [FORGOT PASSWORD] Request received");
    console.log("📧 Email:", req.body.email);

    const { email } = req.body;

    // 🔹 ADD: Validate email is provided
    if (!email) {
      console.log("❌ [FORGOT PASSWORD] Email not provided");
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    console.log("🔍 [FORGOT PASSWORD] Searching for user...");
    user = await UserModel.findOne({ email });

    if (!user) {
      console.log("❌ [FORGOT PASSWORD] User not found");
      return res.status(404).json({
        success: false,
        message: "Email does not exist, please enter correct email",
      });
    }

    console.log("✅ [FORGOT PASSWORD] User found:", user._id);

    // 🔹 Generate reset token
    console.log("🔑 [FORGOT PASSWORD] Generating reset token...");
    const resetToken = user.createPasswordResetToken();
    console.log("🔑 [FORGOT PASSWORD] Token generated (first 10 chars):", resetToken.substring(0, 10) + "...");
    
    await user.save({ validateBeforeSave: false });
    console.log("💾 [FORGOT PASSWORD] User saved with reset token");

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log("🔗 [FORGOT PASSWORD] Reset URL:", resetUrl);

    // 🔹 IMPROVED: Better email template
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
        <div style="background-color: #9a8457; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
            Hello,
          </p>
          <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
            You have requested to reset your password. Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #9a8457; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
            Or copy and paste this link in your browser:
          </p>
          <p style="font-size: 14px; color: #9a8457; word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          <p style="font-size: 14px; color: #ef4444; margin-top: 20px;">
            ⚠️ This link is valid for 15 minutes only.
          </p>
          <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
            If you did not request this password reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    `;

    console.log("📨 [FORGOT PASSWORD] Attempting to send email...");
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message,
    });

    console.log("✅ [FORGOT PASSWORD] Email sent successfully");

    // 🔹 CHANGED: Return consistent message format
    res.status(200).json({ 
      success: true, 
      message: "Password reset link sent to your email"  // Changed from "data" to "message"
    });

    console.log("🎉 [FORGOT PASSWORD] Request completed successfully");

  } catch (error) {
    console.error("❌ [FORGOT PASSWORD] Error:", error.message);
    console.error("❌ [FORGOT PASSWORD] Full error:", error);

    if (user) {
      console.log("🧹 [FORGOT PASSWORD] Cleaning up reset token...");
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({ 
      success: false, 
      message: "Email could not be sent. Please try again later."  // Changed from "error" to "message"
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    console.log("🔐 [RESET PASSWORD] Request received");
    console.log("🔑 [RESET PASSWORD] Token (first 10 chars):", req.params.token.substring(0, 10) + "...");

    const { password } = req.body;

    // 🔹 ADD: Validate password is provided
    if (!password) {
      console.log("❌ [RESET PASSWORD] Password not provided");
      return res.status(400).json({
        success: false,
        error: "Password is required"
      });
    }

    // 🔹 ADD: Validate password length
    if (password.length < 6) {
      console.log("❌ [RESET PASSWORD] Password too short");
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters"
      });
    }

    console.log("🔑 [RESET PASSWORD] Hashing token...");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    console.log("🔍 [RESET PASSWORD] Searching for user with valid token...");
    const user = await UserModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      console.log("❌ [RESET PASSWORD] No user found with valid token");
      return res.status(400).json({
        success: false,
        error: "Invalid or expired token. Please request a new password reset.",
      });
    }

    console.log("✅ [RESET PASSWORD] User found:", user._id);
    console.log("🔒 [RESET PASSWORD] Updating password...");

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.log("✅ [RESET PASSWORD] Password updated successfully");

    // 🔹 CHANGED: Better response message
    res.status(200).json({  // Changed from 201 to 200
      success: true,
      message: "Password reset successfully. You can now login with your new password.",  // Changed from "data" to "message"
    });

    console.log("🎉 [RESET PASSWORD] Request completed successfully");

  } catch (error) {
    console.error("❌ [RESET PASSWORD] Error:", error.message);
    console.error("❌ [RESET PASSWORD] Full error:", error);
    
    res.status(500).json({ 
      success: false, 
      error: "Server Error. Please try again later." 
    });
  }
};
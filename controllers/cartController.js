// controllers/cartController.js
import { v4 as uuidv4 } from "uuid";
import Cart from "../models/Cart.js";
import Ornament from "../models/Ornament.js";
import crypto from "crypto";
import UserModel from "../models/User.js";
import sendEmail from "../emailer/sendEmail.js"

/**
 * Create a guest cart and return guestId 
 * POST /api/cart/guest/init
 */
export const initGuestCart = async (req, res) => {
  try {
    const guestId = uuidv4();
    const cart = new Cart({ guestId, items: [] });
    await cart.save();
    return res.status(201).json({ success: true, guestId, cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create guest cart", error: err.message });
  }
};

/**
 * Add item to guest cart
 * POST /api/cart/guest/add
 * body: { guestId?, ornamentId, quantity }
 */
export const addToGuestCart = async (req, res) => {
  try {
    let { guestId, ornamentId, quantity } = req.body;

    if (!ornamentId) {
      return res.status(400).json({ success: false, message: "ornamentId is required" });
    }

    // 🔹 CHANGE: Auto-generate guestId if not provided
    if (!guestId) {
      guestId = uuidv4();
    }

    const ornament = await Ornament.findById(ornamentId);
    if (!ornament) return res.status(404).json({ success: false, message: "Ornament not found" });

    let cart = await Cart.findOne({ guestId });
    if (!cart) cart = new Cart({ guestId, items: [] });

    const existing = cart.items.find(i => i.ornament.toString() === ornamentId);
    if (existing) existing.quantity += (quantity || 1);
    else cart.items.push({ ornament: ornamentId, quantity: quantity || 1 });

    await cart.save();
    await cart.populate("items.ornament");

    // 🔹 CHANGE: return guestId in response (important for first-time guest)
    return res.json({ success: true, message: "Added to guest cart", guestId, cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to add to guest cart", error: err.message });
  }
};

/**
 * Get guest cart
 * GET /api/cart/guest/:guestId
 */
export const getGuestCart = async (req, res) => {
  try {
    const { guestId } = req.params;
    if (!guestId) return res.status(400).json({ success: false, message: "guestId required" });

    const cart = await Cart.findOne({ guestId }).populate("items.ornament");
    if (!cart) return res.json({ success: true, cart: { items: [] } });

    return res.json({ success: true, cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch guest cart", error: err.message });
  }
};

/**
 * Add item to logged-in user's cart
 * POST /api/cart/user/add
 */
export const addToUserCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { ornamentId, quantity } = req.body;
    if (!ornamentId) return res.status(400).json({ success: false, message: "ornamentId required" });

    const ornament = await Ornament.findById(ornamentId);
    if (!ornament) return res.status(404).json({ success: false, message: "Ornament not found" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const existing = cart.items.find(i => i.ornament.toString() === ornamentId);
    if (existing) existing.quantity += (quantity || 1);
    else cart.items.push({ ornament: ornamentId, quantity: quantity || 1 });

    await cart.save();
    await cart.populate("items.ornament");
    return res.json({ success: true, message: "Added to cart", cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to add to cart", error: err.message });
  }
};

/**
 * Get user's cart (protected)
 * GET /api/cart/user
 */
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const cart = await Cart.findOne({ user: userId }).populate("items.ornament");
    if (!cart) return res.json({ success: true, cart: { items: [] } });
    return res.json({ success: true, cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch cart", error: err.message });
  }
};

/**
 * Update item quantity in user cart (protected)
 * PUT /api/cart/user/update
 */
export const updateUserCartItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { ornamentId, quantity } = req.body;
    if (!ornamentId || typeof quantity !== "number") {
      return res.status(400).json({ success: false, message: "ornamentId and numeric quantity required" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find(i => i.ornament.toString() === ornamentId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found in cart" });

    item.quantity = quantity;
    await cart.save();
    await cart.populate("items.ornament");
    return res.json({ success: true, message: "Cart updated", cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update cart", error: err.message });
  }
};

/**
 * Remove item from user cart (protected)
 * DELETE /api/cart/user/remove/:ornamentId
 */
export const removeUserCartItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ornamentId = req.params.ornamentId;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(i => i.ornament.toString() !== ornamentId);
    await cart.save();
    await cart.populate("items.ornament");
    return res.json({ success: true, message: "Item removed", cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to remove item", error: err.message });
  }
};

/**
 * Remove item from guest cart
 * DELETE /api/cart/guest/remove/:guestId/:ornamentId
 */
export const removeGuestCartItem = async (req, res) => {
  try {
    const { guestId, ornamentId } = req.params;
    const cart = await Cart.findOne({ guestId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(i => i.ornament.toString() !== ornamentId);
    await cart.save();
    await cart.populate("items.ornament");
    return res.json({ success: true, message: "Item removed from guest cart", cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to remove guest item", error: err.message });
  }
};

/**
 * Merge guest cart into user cart (internal utility)
 * Call when user logs in (pass guestId from frontend)
 */
export const mergeGuestCartToUser = async (guestId, userId) => {
  if (!guestId) return;
  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || !guestCart.items || guestCart.items.length === 0) return;

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) userCart = new Cart({ user: userId, items: [] });

  for (const gItem of guestCart.items) {
    const existing = userCart.items.find(i => i.ornament.toString() === gItem.ornament.toString());
    if (existing) existing.quantity += gItem.quantity;
    else userCart.items.push({ ornament: gItem.ornament, quantity: gItem.quantity });
  }

  await userCart.save();
  await Cart.deleteOne({ guestId }); // cleanup guest cart
  return userCart;
};

// ============================================
// 🔐 PASSWORD RESET CONTROLLERS
// ============================================

/**
 * Forgot Password - Send reset email
 * POST /api/user/forgetpassword
 * body: { email }
 */
export const forgetPassword = async (req, res) => {
  let user;
  try {
    console.log("🔐 [FORGOT PASSWORD] Request received");
    console.log("📧 Email:", req.body.email);

    const { email } = req.body;
    
    if (!email) {
      console.log("❌ [FORGOT PASSWORD] Email not provided");
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    console.log("🔍 [FORGOT PASSWORD] Searching for user with email:", email);
    user = await UserModel.findOne({ email });

    if (!user) {
      console.log("❌ [FORGOT PASSWORD] User not found for email:", email);
      return res.status(404).json({
        success: false,
        message: "Email does not exist, please enter correct email",
      });
    }

    console.log("✅ [FORGOT PASSWORD] User found:", user._id);

    // 🔹 Generate reset token
    console.log("🔑 [FORGOT PASSWORD] Generating reset token...");
    const resetToken = user.createPasswordResetToken();
    console.log("🔑 [FORGOT PASSWORD] Plain token generated (first 10 chars):", resetToken.substring(0, 10) + "...");
    console.log("🔑 [FORGOT PASSWORD] Hashed token saved to DB (first 10 chars):", user.resetPasswordToken.substring(0, 10) + "...");
    console.log("⏰ [FORGOT PASSWORD] Token expiry set to:", new Date(user.resetPasswordExpire).toLocaleString());

    await user.save({ validateBeforeSave: false });
    console.log("💾 [FORGOT PASSWORD] User saved with reset token");

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log("🔗 [FORGOT PASSWORD] Reset URL:", resetUrl);

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

    console.log("✅ [FORGOT PASSWORD] Email sent successfully to:", user.email);

    res.status(200).json({ 
      success: true, 
      message: "Password reset link sent to your email" 
    });

    console.log("🎉 [FORGOT PASSWORD] Request completed successfully");

  } catch (error) {
    console.error("❌ [FORGOT PASSWORD] Error occurred:", error.message);
    console.error("❌ [FORGOT PASSWORD] Full error:", error);

    if (user) {
      console.log("🧹 [FORGOT PASSWORD] Cleaning up user reset token due to error");
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.log("🧹 [FORGOT PASSWORD] Reset token cleared from DB");
    }

    res.status(500).json({ 
      success: false, 
      message: "Email could not be sent. Please try again later." 
    });
  }
};

/**
 * Reset Password - Update password with token
 * PUT /api/user/resetpassword/:token
 * body: { password }
 */
export const resetPassword = async (req, res) => {
  try {
    console.log("🔐 [RESET PASSWORD] Request received");
    console.log("🔑 [RESET PASSWORD] Token from URL (first 10 chars):", req.params.token.substring(0, 10) + "...");

    const { password } = req.body;

    if (!password) {
      console.log("❌ [RESET PASSWORD] Password not provided");
      return res.status(400).json({
        success: false,
        error: "Password is required"
      });
    }

    console.log("🔒 [RESET PASSWORD] Password length:", password.length);

    if (password.length < 6) {
      console.log("❌ [RESET PASSWORD] Password too short (< 6 characters)");
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters"
      });
    }

    // Hash the token from URL to match with database
    console.log("🔑 [RESET PASSWORD] Hashing token to match with DB...");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    console.log("🔑 [RESET PASSWORD] Hashed token (first 10 chars):", resetPasswordToken.substring(0, 10) + "...");
    console.log("🔍 [RESET PASSWORD] Searching for user with valid token...");
    console.log("⏰ [RESET PASSWORD] Current time:", new Date().toLocaleString());

    const user = await UserModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      console.log("❌ [RESET PASSWORD] No user found with valid token");
      console.log("❌ [RESET PASSWORD] Token may be invalid or expired");
      return res.status(400).json({
        success: false,
        error: "Invalid or expired token. Please request a new password reset.",
      });
    }

    console.log("✅ [RESET PASSWORD] User found:", user._id);
    console.log("📧 [RESET PASSWORD] User email:", user.email);
    console.log("⏰ [RESET PASSWORD] Token expiry:", new Date(user.resetPasswordExpire).toLocaleString());

    // Set new password (will be hashed by pre-save hook)
    console.log("🔒 [RESET PASSWORD] Setting new password...");
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    console.log("💾 [RESET PASSWORD] Saving user with new password...");
    await user.save();
    console.log("✅ [RESET PASSWORD] Password updated successfully");
    console.log("🧹 [RESET PASSWORD] Reset token cleared from DB");

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });

    console.log("🎉 [RESET PASSWORD] Request completed successfully for user:", user.email);

  } catch (error) {
    console.error("❌ [RESET PASSWORD] Error occurred:", error.message);
    console.error("❌ [RESET PASSWORD] Full error:", error);
    console.error("❌ [RESET PASSWORD] Stack trace:", error.stack);

    res.status(500).json({ 
      success: false, 
      error: "Server Error. Please try again later." 
    });
  }
};
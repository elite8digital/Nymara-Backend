


// import Razorpay from "razorpay";
// import crypto from "crypto";
// import UserOrder from "../models/UserOrder.js";
// import Ornament from "../models/Ornament.js";
// import UserModel from "../models/User.js";
// import sendEmail from "../emailer/sendEmail.js";
// import axios from "axios";
// import {sendWhatsAppMessage} from "../emailer/whatsapp.js";

// // 🔹 Initialize Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Zero-decimal currencies — amount is passed as-is (no x100)
// const ZERO_DECIMAL_CURRENCIES = new Set([
//   "JPY",
//   "KRW",
//   "VND",
//   "IDR",
//   "ISK",
//   "BIF",
//   "CLP",
//   "GNF",
//   "MGA",
//   "PYG",
//   "RWF",
//   "UGX",
//   "XAF",
//   "XOF",
// ]);

// const toSmallestUnit = (amount, currency) => {
//   if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) {
//     return Math.round(amount);
//   }
//   return Math.round(amount * 100);
// };

// //  1. Create Razorpay order
// export const createRazorpayOrder = async (req, res) => {
//   try {
//     const {
//       products,
//       deliveryAddress,
//       currency = "INR",
//       symbol = "₹",
//       totalAmount: frontendTotal,
//     } = req.body;

//     if (!products || products.length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No products in cart" });
//     }

//     // 🔹 Use frontend-calculated total if provided, otherwise calculate from DB
//     let totalAmount;
//     const productDetails = [];

//     if (frontendTotal !== undefined && frontendTotal !== null) {
//       // ✅ Use the exact total from frontend (what user sees on cart page)
//       totalAmount = Number(frontendTotal);
//       console.log(
//         `💰 [BACKEND] Using frontend-calculated total: ${totalAmount} ${currency}`,
//       );
//       console.log(`💰 [BACKEND] Total type: ${typeof totalAmount}`);
//       console.log(`💰 [BACKEND] Total in paise: ${totalAmount * 100}`);

//       // Still validate products exist and store basic details
//       for (let p of products) {
//         const product = await Ornament.findById(p.productId);
//         if (!product)
//           return res
//             .status(404)
//             .json({ success: false, message: "Product not found" });

//         productDetails.push({
//           productId: p.productId,
//           variant: p.variant,
//           quantity: p.quantity,
//           price: { amount: 0, currency, symbol }, // Price stored separately in totalAmount
//         });
//       }
//     } else {
//       // ⚠️ Fallback: Calculate from DB (legacy behavior)
//       totalAmount = 0;

//       for (let p of products) {
//         const product = await Ornament.findById(p.productId);
//         if (!product)
//           return res
//             .status(404)
//             .json({ success: false, message: "Product not found" });

//         // Get price based on currency
//         let priceAmount;
//         const dbPrice = product.prices?.[currency]?.amount;
//         if (dbPrice !== undefined && dbPrice !== null) {
//           priceAmount = Number(dbPrice);
//         } else {
//           priceAmount = product.price || 0;
//         }

//         const priceData = { amount: priceAmount, symbol };

//         // Get making charges based on currency
//         let makingCharges = 0;
//         const dbMaking = product.makingChargesByCountry?.[currency]?.amount;
//         if (dbMaking !== undefined && dbMaking !== null) {
//           makingCharges = Number(dbMaking);
//         } else {
//           makingCharges = product.makingCharges || 0;
//         }

//         // Calculate item price (price + making charges)
//         const itemPrice = priceData.amount + makingCharges;
//         const itemTotal = itemPrice * p.quantity;
//         totalAmount += itemTotal;

//         productDetails.push({
//           productId: p.productId,
//           variant: p.variant,
//           quantity: p.quantity,
//           price: { amount: itemPrice, currency, symbol },
//         });

//         console.log(`💰 [ORDER] Product: ${product.name}`);
//         console.log(`   Price: ${priceData.amount} ${currency}`);
//         console.log(`   Making: ${makingCharges} ${currency}`);
//         console.log(`   Item Price: ${itemPrice} ${currency}`);
//         console.log(`   Quantity: ${p.quantity}`);
//         console.log(`   Item Total: ${itemTotal} ${currency}`);
//       }

//       console.log(
//         `💰 [ORDER] Backend-calculated total: ${totalAmount} ${currency}`,
//       );
//     }

//     // 🔹 Create Razorpay order
//     console.log(
//       `💰 [BACKEND] Creating Razorpay order with amount: ${totalAmount} ${currency}`,
//     );
//     console.log(
//       `💰 [BACKEND] Amount in paise for Razorpay: ${Math.round(totalAmount * 100)}`,
//     );

//     // Check if amount exceeds Razorpay test mode limit (5 lakhs INR)
//     const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_");
//     if (isTestMode && currency === "INR" && totalAmount > 2000000) {
//       console.warn(
//         `⚠️ [BACKEND] Amount ${totalAmount} exceeds test mode limit of 500000`,
//       );
//       return res.status(400).json({
//         success: false,
//         message: `Order amount ₹${totalAmount.toLocaleString()} exceeds Razorpay test mode limit of ₹5,00,000. Please use live mode or reduce cart items.`,
//         errorCode: "AMOUNT_EXCEEDS_TEST_LIMIT",
//       });
//     }

//     const razorpayOrder = await razorpay.orders.create({
//       amount: toSmallestUnit(totalAmount, currency),
//       currency,
//       receipt: `rcpt_${Date.now()}`,
//     });

//     console.log(`✅ [BACKEND] Razorpay order created:`, razorpayOrder.id);
//     console.log(`✅ [BACKEND] Razorpay order amount:`, razorpayOrder.amount);

//     // 🔹 Save pending order in DB
//     const order = new UserOrder({
//       userId: req.user.id || req.user._id, // Handle both id and _id from JWT
//       products: productDetails, // Use calculated product details with correct prices
//       totalAmount: { amount: totalAmount, currency, symbol },
//       razorpayOrderId: razorpayOrder.id,
//       deliveryAddress,
//       paymentStatus: "Pending",
//       status: "pending",
//     });

//     await order.save();

//     console.log(`📦 [BACKEND] Order saved with oId: ${order.oId}`);
//     console.log(`📦 [BACKEND] Sending response with amount: ${totalAmount}`);

//     res.json({
//       success: true,
//       razorpayOrderId: razorpayOrder.id,
//       amount: totalAmount,
//       currency,
//       oId: order.oId,
//     });
//   } catch (error) {
//     console.error("❌ Error creating Razorpay order:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// //  2. Verify payment (Razorpay callback) with idempotency
// export const verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, oId } =
//       req.body;

//     // 🔹 Validate required fields
//     if (
//       !razorpay_order_id ||
//       !razorpay_payment_id ||
//       !razorpay_signature ||
//       !oId
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required payment parameters",
//       });
//     }

//     // 🔹 Find order first
//     const order = await UserOrder.findOne({ oId });
//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     }

//     //  IDEMPOTENCY CHECK: If payment already processed, return success
//     if (
//       order.paymentStatus === "Paid" &&
//       order.razorpayPaymentId === razorpay_payment_id
//     ) {
//       return res.json({
//         success: true,
//         message: "Payment already verified",
//         order,
//         alreadyProcessed: true,
//       });
//     }

//     // 🔹 Verify order matches razorpay order ID
//     if (order.razorpayOrderId !== razorpay_order_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Order ID mismatch",
//       });
//     }

//     // 🔹 Verify signature
//     const sign = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(sign.toString())
//       .digest("hex");

//     if (razorpay_signature !== expectedSignature) {
//       // Mark payment as failed
//       order.paymentStatus = "Failed";
//       await order.save();

//       return res.status(400).json({
//         success: false,
//         message: "Payment signature verification failed",
//       });
//     }

//     //  Update order as Paid (only if not already paid)
//     if (order.paymentStatus !== "Paid") {
//       order.razorpayPaymentId = razorpay_payment_id;
//       order.paymentStatus = "Paid";
//       order.status = "processing";
//       await order.save();

//     const user = await UserModel.findById(order.userId);

//       // Send order confirmation emails (non-blocking)
//       try {
//         const populatedOrder = await UserOrder.findOne({ oId }).populate(
//           "products.productId",
//           "name",
//         );

   

//         await axios.post(
//           "https://lets-taxify.onrender.com/api/nymara/contact/order-confirmation",
//           {
//             user,
//             order,
//             products: populatedOrder.products.map((p) => ({
//               name: p.productId?.name,
//               quantity: p.quantity,
//               price: p.price?.amount,
//             })),
//           },
//           { timeout: 5000 }, // ✅ important
//         );

//         console.log("📧 Email service called successfully");
//       } catch (err) {
//         console.error("⚠️ Email service failed:", err.message);
//       }

//         try {
//   if (user?.phoneNumber) {
//     await sendWhatsAppMessage(user.phoneNumber, order);
//     console.log("📱 WhatsApp message sent successfully");
//   } else {
//     console.warn("⚠️ User phone not available");
//   }
// } catch (err) {
//   console.error("⚠️ WhatsApp message failed:", err.message);
// }
//     }

//     res.json({
//       success: true,
//       message: "Payment verified successfully",
//       order,
//     });
//   } catch (error) {
//     console.error(" Error verifying payment:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error during payment verification",
//     });
//   }
// };
import Razorpay from "razorpay";
import crypto from "crypto";
import UserOrder from "../models/UserOrder.js";
import Ornament from "../models/Ornament.js";
import UserModel from "../models/User.js";
import sendEmail from "../emailer/sendEmail.js";
import axios from "axios";
import {sendWhatsAppMessage} from "../emailer/whatsapp.js";

// 🔹 Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Zero-decimal currencies — amount is passed as-is (no x100)
const ZERO_DECIMAL_CURRENCIES = new Set([
  "JPY",
  "KRW",
  "VND",
  "IDR",
  "ISK",
  "BIF",
  "CLP",
  "GNF",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "XAF",
  "XOF",
]);

const toSmallestUnit = (amount, currency) => {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
};

//  1. Create Razorpay order
export const createRazorpayOrder = async (req, res) => {
  try {
    const {
      products,
      deliveryAddress,
      currency = "INR",
      symbol = "₹",
      totalAmount: frontendTotal,
    } = req.body;

    if (!products || products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No products in cart" });
    }

    // 🔹 Use frontend-calculated total if provided, otherwise calculate from DB
    let totalAmount;
    const productDetails = [];

    if (frontendTotal !== undefined && frontendTotal !== null) {
      // ✅ Use the exact total from frontend (what user sees on cart page)
      totalAmount = Number(frontendTotal);
      console.log(
        `💰 [BACKEND] Using frontend-calculated total: ${totalAmount} ${currency}`,
      );
      console.log(`💰 [BACKEND] Total type: ${typeof totalAmount}`);
      console.log(`💰 [BACKEND] Total in paise: ${totalAmount * 100}`);

      // Still validate products exist and store actual per-item prices
      for (let p of products) {
        const product = await Ornament.findById(p.productId);
        if (!product)
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });

        productDetails.push({
          productId: p.productId,
          variant: p.variant,
          quantity: p.quantity,
          price: {
            amount: p.unitPrice !== undefined ? Number(p.unitPrice) : 0,
            currency,
            symbol,
          },
        });
      }
    } else {
      // ⚠️ Fallback: Calculate from DB (legacy behavior)
      totalAmount = 0;

      for (let p of products) {
        const product = await Ornament.findById(p.productId);
        if (!product)
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });

        // Get price based on currency
        let priceAmount;
        const dbPrice = product.prices?.[currency]?.amount;
        if (dbPrice !== undefined && dbPrice !== null) {
          priceAmount = Number(dbPrice);
        } else {
          priceAmount = product.price || 0;
        }

        const priceData = { amount: priceAmount, symbol };

        // Get making charges based on currency
        let makingCharges = 0;
        const dbMaking = product.makingChargesByCountry?.[currency]?.amount;
        if (dbMaking !== undefined && dbMaking !== null) {
          makingCharges = Number(dbMaking);
        } else {
          makingCharges = product.makingCharges || 0;
        }

        // Calculate item price (price + making charges)
        const itemPrice = priceData.amount + makingCharges;
        const itemTotal = itemPrice * p.quantity;
        totalAmount += itemTotal;

        productDetails.push({
          productId: p.productId,
          variant: p.variant,
          quantity: p.quantity,
          price: { amount: itemPrice, currency, symbol },
        });

        console.log(`💰 [ORDER] Product: ${product.name}`);
        console.log(`   Price: ${priceData.amount} ${currency}`);
        console.log(`   Making: ${makingCharges} ${currency}`);
        console.log(`   Item Price: ${itemPrice} ${currency}`);
        console.log(`   Quantity: ${p.quantity}`);
        console.log(`   Item Total: ${itemTotal} ${currency}`);
      }

      console.log(
        `💰 [ORDER] Backend-calculated total: ${totalAmount} ${currency}`,
      );
    }

    // 🔹 Create Razorpay order
    console.log(
      `💰 [BACKEND] Creating Razorpay order with amount: ${totalAmount} ${currency}`,
    );
    console.log(
      `💰 [BACKEND] Amount in paise for Razorpay: ${Math.round(totalAmount * 100)}`,
    );

    // Check if amount exceeds Razorpay test mode limit (5 lakhs INR)
    const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_");
    if (isTestMode && currency === "INR" && totalAmount > 2000000) {
      console.warn(
        `⚠️ [BACKEND] Amount ${totalAmount} exceeds test mode limit of 500000`,
      );
      return res.status(400).json({
        success: false,
        message: `Order amount ₹${totalAmount.toLocaleString()} exceeds Razorpay test mode limit of ₹5,00,000. Please use live mode or reduce cart items.`,
        errorCode: "AMOUNT_EXCEEDS_TEST_LIMIT",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: toSmallestUnit(totalAmount, currency),
      currency,
      receipt: `rcpt_${Date.now()}`,
    });

    console.log(`✅ [BACKEND] Razorpay order created:`, razorpayOrder.id);
    console.log(`✅ [BACKEND] Razorpay order amount:`, razorpayOrder.amount);

    // 🔹 Save pending order in DB
    const order = new UserOrder({
      userId: req.user.id || req.user._id, // Handle both id and _id from JWT
      products: productDetails, // Use calculated product details with correct prices
      totalAmount: { amount: totalAmount, currency, symbol },
      razorpayOrderId: razorpayOrder.id,
      deliveryAddress,
      paymentStatus: "Pending",
      status: "pending",
    });

    await order.save();

    console.log(`📦 [BACKEND] Order saved with oId: ${order.oId}`);
    console.log(`📦 [BACKEND] Sending response with amount: ${totalAmount}`);

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency,
      oId: order.oId,
    });
  } catch (error) {
    console.error("❌ Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//  2. Verify payment (Razorpay callback) with idempotency
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, oId } =
      req.body;

    // 🔹 Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !oId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment parameters",
      });
    }

    // 🔹 Find order first
    const order = await UserOrder.findOne({ oId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    //  IDEMPOTENCY CHECK: If payment already processed, return success
    if (
      order.paymentStatus === "Paid" &&
      order.razorpayPaymentId === razorpay_payment_id
    ) {
      return res.json({
        success: true,
        message: "Payment already verified",
        order,
        alreadyProcessed: true,
      });
    }

    // 🔹 Verify order matches razorpay order ID
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID mismatch",
      });
    }

    // 🔹 Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSignature) {
      // Mark payment as failed
      order.paymentStatus = "Failed";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    //  Update order as Paid (only if not already paid)
    if (order.paymentStatus !== "Paid") {
      order.razorpayPaymentId = razorpay_payment_id;
      order.paymentStatus = "Paid";
      order.status = "processing";
      await order.save();

    const user = await UserModel.findById(order.userId);

      // Send order confirmation emails (non-blocking)
      try {
        const populatedOrder = await UserOrder.findOne({ oId }).populate(
          "products.productId",
          "name",
        );

   

        await axios.post(
          "https://lets-taxify.onrender.com/api/nymara/contact/order-confirmation",
          {
            user,
            order,
            products: populatedOrder.products.map((p) => ({
              name: p.productId?.name,
              quantity: p.quantity,
              price: p.price?.amount,
            })),
          },
          { timeout: 5000 }, // ✅ important
        );

        console.log("📧 Email service called successfully");
      } catch (err) {
        console.error("⚠️ Email service failed:", err.message);
      }

        try {
  if (user?.phoneNumber) {
    await sendWhatsAppMessage(user.phoneNumber, order);
    console.log("📱 WhatsApp message sent successfully");
  } else {
    console.warn("⚠️ User phone not available");
  }
} catch (err) {
  console.error("⚠️ WhatsApp message failed:", err.message);
}
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error(" Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error during payment verification",
    });
  }
};


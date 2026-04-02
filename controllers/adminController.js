
// import User from "../models/User.js";
// import UserDetails from "../models/UserDetails.js";
// import UserOrder from "../models/UserOrder.js";
// import Ornament from "../models/Ornament.js";
// import { currencyRates } from "../config/currencyRates.js"; // ✅ Currency conversion rates

// // 🔹 Helper to resolve price for selected currency
// const getPriceForCurrency = (ornament, currency = "INR") => {
//   let finalPrice, symbol;

//   // ✅ If product already has stored prices (multi-currency in DB)
//   if (ornament?.prices && ornament.prices.has(currency.toUpperCase())) {
//     const priceObj = ornament.prices.get(currency.toUpperCase());
//     finalPrice = priceObj.amount;
//     symbol = priceObj.symbol;
//   } else {
//     // ✅ Otherwise fallback → convert INR price using currencyRates config
//     const selectedCurrency =
//       currencyRates[currency.toUpperCase()] || currencyRates["INR"];
//     finalPrice = ornament?.price * selectedCurrency.rate;
//     symbol = selectedCurrency.symbol;
//   }

//   return {
//     priceInINR: ornament?.price || 0, // store base INR
//     displayPrice: Number(finalPrice?.toFixed(2)) || 0, // formatted currency price
//     currency: symbol,
//   };
// };

// // 👤 Get summary of all customers (with order counts)
// export const getCustomersSummary = async (req, res) => {
//   try {
//     const users = await User.find({ isAdmin: false }).select("uId name email phoneNumber");

//     const userDetails = await UserDetails.find({
//       userId: { $in: users.map((u) => u._id) },
//     }).select("userId address");

//     const orders = await UserOrder.aggregate([
//       { $group: { _id: "$userId", orderCount: { $sum: 1 } } },
//     ]);

//     const result = users.map((user) => {
//       const detail = userDetails.find(
//         (d) => d.userId.toString() === user._id.toString()
//       );
//       const orderInfo = orders.find(
//         (o) => o._id.toString() === user._id.toString()
//       );

//       const addr = detail?.address || {};
//       const city = addr.city || addr.cityInternational || "";
//       const state = addr.state || addr.stateProvince || "";

//       return {
//         _id: user._id,
//         customerId: user.uId,
//         name: user.name,
//         email: user.email,
//         phoneNumber: user.phoneNumber || null,
//         orderCount: orderInfo ? orderInfo.orderCount : 0,
//         city,
//         state,
//       };
//     });

//     res.json({ success: true, customers: result });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch customers",
//       error: err.message,
//     });
//   }
// };

// // 👤 Get all orders for a specific customer
// export const getCustomerOrders = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const orders = await UserOrder.find({ userId })
//       .select("oId totalAmount products orderDate status paymentStatus deliveryAddress")
//       .lean();

//     const formatted = orders.map((order) => ({
//       orderId: order.oId,
//       totalAmount: order.totalAmount?.amount ?? 0,
//       currency: order.totalAmount?.symbol ?? "₹",
//       itemCount: order.products.length,
//       status: order.status,
//       paymentStatus: order.paymentStatus,
//       orderDate: order.orderDate,
//     }));

//     res.json({ success: true, orders: formatted });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch customer orders",
//       error: err.message,
//     });
//   }
// };

// // 📦 Get all orders (admin dashboard)
// export const getAllOrders = async (req, res) => {
//   try {
//     const orders = await UserOrder.find()
//       .populate("userId", "uId name email")
//       .sort({ createdAt: -1 });

//     const formattedOrders = orders.map((order) => ({
//       orderId: order.oId,
//       date: order.orderDate,
//       customer: {
//         id: order.userId?.uId,
//         name: order.userId?.name,
//         email: order.userId?.email,
//       },
//       items: order.products.length,
//       amount: order.totalAmount?.amount ?? 0,
//       currency: order.totalAmount?.symbol ?? "₹",
//       status: order.status,
//       paymentStatus: order.paymentStatus,
//       city: order.deliveryAddress?.city || "Not Provided",
//       state: order.deliveryAddress?.state || "Not Provided",
//     }));

//     res.json({ success: true, orders: formattedOrders });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch orders",
//       error: err.message,
//     });
//   }
// };

// // 📄 Get single order details (admin view)
// export const getOrderDetails = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await UserOrder.findOne({ oId: orderId })
//       .populate("userId", "uId name email")
//       .populate("products.productId", "name sku metal")
//       .lean();

//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     const userDetails = await UserDetails.findOne({ userId: order.userId._id });

//     const response = {
//       orderId: order.oId,
//       date: order.orderDate,
//       status: order.status,
//       paymentStatus: order.paymentStatus,
//       paymentMethod: order.paymentMethod,
//       razorpayOrderId: order.razorpayOrderId,
//       razorpayPaymentId: order.razorpayPaymentId,
//       deliveryLink: order.deliveryLink,

//       orderItems: order.products.map((p) => {
//         const priceAmount = p.price?.amount ?? p.price?.value ?? 0;
//         const priceSymbol = p.price?.symbol ?? "₹";
//         console.log(`📦 Product: ${p.productId?.name}, price:`, JSON.stringify(p.price), "→ amount:", priceAmount);
//         return {
//           productId: p.productId?._id || p.productId,
//           productSKU: p.productId?.sku || "—",
//           productName: p.productId?.name || "Product",
//           purity: p.productId?.metal?.purity || "—",
//           metalType: p.productId?.metal?.metalType || "—",
//           variant: p.variant || "",
//           quantity: p.quantity,
//           displayPrice: priceAmount,
//           currency: priceSymbol,
//           total: priceAmount * p.quantity,
//         };
//       }),

//       customer: {
//         customerId: order.userId.uId,
//         name: order.userId.name,
//         email: order.userId.email,
//         phone: userDetails?.phoneNumber || "Not Provided",
//       },

//       shippingAddress: order.deliveryAddress,

//       orderSummary: {
//         totalItems: order.products.length,
//         totalAmount: order.totalAmount?.amount ?? 0,
//         currency: order.totalAmount?.symbol ?? "₹",
//       },
//     };

//     res.json({ success: true, order: response });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch order details",
//       error: err.message,
//     });
//   }
// };

// // 🚚 Update order status (admin)
// export const updateOrderStatus = async (req, res) => {
//   try {
//     const { oId } = req.params;
//     const { status, deliveryLink } = req.body;

//     const order = await UserOrder.findOne({ oId });
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     if (status) order.status = status;
//     if (deliveryLink) order.deliveryLink = deliveryLink;

//     await order.save();

//     res.json({ success: true, message: "Order status updated", order });
//   } catch (error) {
//     console.error("❌ Error updating order status:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // 💰 Handle refunds (admin)
// export const handleRefund = async (req, res) => {
//   try {
//     const { oId } = req.params;
//     const { refundAmount, refundStatus } = req.body;

//     const order = await UserOrder.findOne({ oId });
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     if (refundAmount !== undefined) order.refundAmount = refundAmount;
//     if (refundStatus) order.refundStatus = refundStatus;

//     // ✅ If refund is processed, mark payment as Refunded
//     if (refundStatus === "processed") {
//       order.paymentStatus = "Refunded";
//     }

//     await order.save();

//     res.json({ success: true, message: "Refund updated", order });
//   } catch (error) {
//     console.error("❌ Error handling refund:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


import User from "../models/User.js";
import UserDetails from "../models/UserDetails.js";
import UserOrder from "../models/UserOrder.js";
import Ornament from "../models/Ornament.js";
import { currencyRates } from "../config/currencyRates.js"; // ✅ Currency conversion rates

// 🔹 Helper to resolve price for selected currency
const getPriceForCurrency = (ornament, currency = "INR") => {
  let finalPrice, symbol;

  // ✅ If product already has stored prices (multi-currency in DB)
  if (ornament?.prices && ornament.prices.has(currency.toUpperCase())) {
    const priceObj = ornament.prices.get(currency.toUpperCase());
    finalPrice = priceObj.amount;
    symbol = priceObj.symbol;
  } else {
    // ✅ Otherwise fallback → convert INR price using currencyRates config
    const selectedCurrency =
      currencyRates[currency.toUpperCase()] || currencyRates["INR"];
    finalPrice = ornament?.price * selectedCurrency.rate;
    symbol = selectedCurrency.symbol;
  }

  return {
    priceInINR: ornament?.price || 0, // store base INR
    displayPrice: Number(finalPrice?.toFixed(2)) || 0, // formatted currency price
    currency: symbol,
  };
};

// 👤 Get summary of all customers (with order counts)
// export const getCustomersSummary = async (req, res) => {
//   try {
//     const users = await User.find({ isAdmin: false }).select("uId name email phoneNumber");

//     const userDetails = await UserDetails.find({
//       userId: { $in: users.map((u) => u._id) },
//     }).select("userId address");

//     const orders = await UserOrder.aggregate([
//       { $group: { _id: "$userId", orderCount: { $sum: 1 } } },
//     ]);

//     const result = users.map((user) => {
//       const detail = userDetails.find(
//         (d) => d.userId.toString() === user._id.toString()
//       );
//       const orderInfo = orders.find(
//         (o) => o._id.toString() === user._id.toString()
//       );

//       const addr = detail?.address || {};
//       const city = addr.city || addr.cityInternational || "";
//       const state = addr.state || addr.stateProvince || "";

//       return {
//         _id: user._id,
//         customerId: user.uId,
//         name: user.name,
//         email: user.email,
//         phoneNumber: user.phoneNumber || null,
//         orderCount: orderInfo ? orderInfo.orderCount : 0,
//         city,
//         state,
//       };
//     });

//     res.json({ success: true, customers: result });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch customers",
//       error: err.message,
//     });
//   }
// };

export const getCustomersSummary = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search,
      city,
      state,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // 🔥 Base match (non-admin users)
    const matchUser = { isAdmin: false };

    // 🔍 Search filter
    if (search) {
      matchUser.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { uId: { $regex: search, $options: "i" } },
      ];
    }

    const pipeline = [
      { $match: matchUser },

      // 👉 Join UserDetails
      {
        $lookup: {
          from: "userdetails",
          localField: "_id",
          foreignField: "userId",
          as: "details",
        },
      },
      {
        $unwind: {
          path: "$details",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 👉 Join Orders
      {
        $lookup: {
          from: "userorders",
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },

      // 👉 Add computed fields
      {
        $addFields: {
          orderCount: { $size: "$orders" },
          city: {
            $ifNull: [
              "$details.address.city",
              "$details.address.cityInternational",
            ],
          },
          state: {
            $ifNull: [
              "$details.address.state",
              "$details.address.stateProvince",
            ],
          },
        },
      },

      // 📍 City filter
      ...(city
        ? [
            {
              $match: {
                city: { $regex: city, $options: "i" },
              },
            },
          ]
        : []),

      // 📍 State filter
      ...(state
        ? [
            {
              $match: {
                state: { $regex: state, $options: "i" },
              },
            },
          ]
        : []),

      // 📦 Projection
      {
        $project: {
          _id: 1,
          customerId: "$uId",
          name: 1,
          email: 1,
          phoneNumber: 1,
          orderCount: 1,
          city: 1,
          state: 1,
        },
      },

      { $sort: { orderCount: -1 } },

      // Pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    // ✅ Data
    const customers = await User.aggregate(pipeline);

    // ✅ Count pipeline (IMPORTANT)
    const countPipeline = [
      { $match: matchUser },

      {
        $lookup: {
          from: "userdetails",
          localField: "_id",
          foreignField: "userId",
          as: "details",
        },
      },
      {
        $unwind: {
          path: "$details",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          city: {
            $ifNull: [
              "$details.address.city",
              "$details.address.cityInternational",
            ],
          },
          state: {
            $ifNull: [
              "$details.address.state",
              "$details.address.stateProvince",
            ],
          },
        },
      },

      ...(city
        ? [
            {
              $match: {
                city: { $regex: city, $options: "i" },
              },
            },
          ]
        : []),

      ...(state
        ? [
            {
              $match: {
                state: { $regex: state, $options: "i" },
              },
            },
          ]
        : []),

      { $count: "total" },
    ];

    const totalResult = await User.aggregate(countPipeline);
    const totalCustomers = totalResult[0]?.total || 0;

    res.json({
      success: true,
      page,
      totalPages: Math.ceil(totalCustomers / limit),
      totalCustomers,
      customers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: err.message,
    });
  }
};

// 👤 Get all orders for a specific customer
export const getCustomerOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await UserOrder.find({ userId })
      .select("oId totalAmount products orderDate status paymentStatus deliveryAddress")
      .lean();

    const formatted = orders.map((order) => ({
      orderId: order.oId,
      totalAmount: order.totalAmount?.amount ?? 0,
      currency: order.totalAmount?.symbol ?? "₹",
      itemCount: order.products.length,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderDate: order.orderDate,
    }));

    res.json({ success: true, orders: formatted });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer orders",
      error: err.message,
    });
  }
};

// 📦 Get all orders (admin dashboard)
// export const getAllOrders = async (req, res) => {
//   try {
//     const orders = await UserOrder.find()
//       .populate("userId", "uId name email")
//       .sort({ createdAt: -1 });

//     const formattedOrders = orders.map((order) => ({
//       orderId: order.oId,
//       date: order.orderDate,
//       customer: {
//         id: order.userId?.uId,
//         name: order.userId?.name,
//         email: order.userId?.email,
//       },
//       items: order.products.length,
//       amount: order.totalAmount?.amount ?? 0,
//       currency: order.totalAmount?.symbol ?? "₹",
//       status: order.status,
//       paymentStatus: order.paymentStatus,
//       city: order.deliveryAddress?.city || "Not Provided",
//       state: order.deliveryAddress?.state || "Not Provided",
//     }));

//     res.json({ success: true, orders: formattedOrders });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch orders",
//       error: err.message,
//     });
//   }
// };

export const getAllOrders = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      search,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    //  Base match query
    const matchStage = {};

    if (status) matchStage.status = status;
    if (paymentStatus) matchStage.paymentStatus = paymentStatus;

    //  Date filter
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    //  Amount filter
    if (minAmount || maxAmount) {
      matchStage["totalAmount.amount"] = {};
      if (minAmount)
        matchStage["totalAmount.amount"].$gte = Number(minAmount);
      if (maxAmount)
        matchStage["totalAmount.amount"].$lte = Number(maxAmount);
    }

    //  AGGREGATION PIPELINE (BEST APPROACH)
    const pipeline = [
      { $match: matchStage },

      {
        $lookup: {
          from: "users", // collection name in MongoDB
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      //  Search across order + user
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { oId: { $regex: search, $options: "i" } },
                  { "user.name": { $regex: search, $options: "i" } },
                  { "user.email": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      { $sort: { createdAt: -1 } },

      // Pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    //  Fetch paginated orders
    const orders = await UserOrder.aggregate(pipeline);

    //  Count pipeline (IMPORTANT)
    const countPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      ...(search
        ? [
            {
              $match: {
                $or: [
                  { oId: { $regex: search, $options: "i" } },
                  { "user.name": { $regex: search, $options: "i" } },
                  { "user.email": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      { $count: "total" },
    ];

    const totalResult = await UserOrder.aggregate(countPipeline);
    const totalOrders = totalResult[0]?.total || 0;

    //  Format response
    const formattedOrders = orders.map((order) => ({
      orderId: order.oId,
      date: order.orderDate,
      customer: {
        id: order.user?.uId,
        name: order.user?.name,
        email: order.user?.email,
      },
      items: order.products.length,
      amount: order.totalAmount?.amount ?? 0,
      currency: order.totalAmount?.symbol ?? "₹",
      status: order.status,
      paymentStatus: order.paymentStatus,
      city: order.deliveryAddress?.city || "Not Provided",
      state: order.deliveryAddress?.state || "Not Provided",
    }));

    res.json({
      success: true,
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders: formattedOrders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
};

// 📄 Get single order details (admin view)
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await UserOrder.findOne({ oId: orderId })
      .populate("userId", "uId name email")
      .populate("products.productId", "name sku metal")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const userDetails = await UserDetails.findOne({ userId: order.userId._id });

    const response = {
      orderId: order.oId,
      date: order.orderDate,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      deliveryLink: order.deliveryLink,
      receiptLink: order.receiptLink,

      orderItems: order.products.map((p) => {
        const priceAmount = p.price?.amount ?? p.price?.value ?? 0;
        const priceSymbol = p.price?.symbol ?? "₹";
        console.log(`📦 Product: ${p.productId?.name}, price:`, JSON.stringify(p.price), "→ amount:", priceAmount);
        return {
          productId: p.productId?._id || p.productId,
          productSKU: p.productId?.sku || "—",
          productName: p.productId?.name || "Product",
          purity: p.productId?.metal?.purity || "—",
          metalType: p.productId?.metal?.metalType || "—",
          variant: p.variant || "",
          quantity: p.quantity,
          displayPrice: priceAmount,
          currency: priceSymbol,
          total: priceAmount * p.quantity,
        };
      }),

      customer: {
        customerId: order.userId.uId,
        name: order.userId.name,
        email: order.userId.email,
        phone: userDetails?.phoneNumber || "Not Provided",
      },

      shippingAddress: order.deliveryAddress,

      orderSummary: {
        totalItems: order.products.length,
        totalAmount: order.totalAmount?.amount ?? 0,
        currency: order.totalAmount?.symbol ?? "₹",
      },
    };

    res.json({ success: true, order: response });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: err.message,
    });
  }
};

// 🚚 Update order status (admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { oId } = req.params;
    const { status, deliveryLink, receiptLink } = req.body;

    const order = await UserOrder.findOne({ oId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (status) order.status = status;
    if (deliveryLink !== undefined) order.deliveryLink = deliveryLink;
    if (receiptLink !== undefined) order.receiptLink = receiptLink;

    await order.save();

    res.json({ success: true, message: "Order status updated", order });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 💰 Handle refunds (admin)
export const handleRefund = async (req, res) => {
  try {
    const { oId } = req.params;
    const { refundAmount, refundStatus } = req.body;

    const order = await UserOrder.findOne({ oId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (refundAmount !== undefined) order.refundAmount = refundAmount;
    if (refundStatus) order.refundStatus = refundStatus;

    // ✅ If refund is processed, mark payment as Refunded
    if (refundStatus === "processed") {
      order.paymentStatus = "Refunded";
    }

    await order.save();

    res.json({ success: true, message: "Refund updated", order });
  } catch (error) {
    console.error("❌ Error handling refund:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};





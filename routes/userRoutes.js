import express from "express";
import mongoose from "mongoose";
import Ornament from "../models/Ornament.js";
import { protect } from "../middleware/authMiddleware.js";
import { saveUserDetails, getUserDetails } from "../controllers/userDetailsController.js";
import { currencyRates } from "../config/currencyRates.js";
import { forgetPassword, resetPassword } from "../emailer/password.js";
import CustomRequest from "../models/CustomRequest.js";
import sendEmail from "../emailer/sendEmail.js";
import Pricing from "../models/Pricing.js"; 

const router = express.Router();

// router.get("/ornaments", async (req, res) => {
//   try {
//     const {
//       gender,
//       category,
//       subCategory,
//       metalType,
//       stoneType,
//       size,
//       color,
//       minPrice,
//       maxPrice,
//       search,
//       sort,
//       currency = "INR",
//       includeVariants = "false",
//     } = req.query;

//     const curr = currency.toUpperCase();
//     const currencyRates = {
//       INR: { rate: 1, symbol: "₹" },
//       USD: { rate: 0.012, symbol: "$" },
//       GBP: { rate: 0.0095, symbol: "£" },
//       CAD: { rate: 0.016, symbol: "CA$" },
//       EUR: { rate: 0.011, symbol: "€" },
//     };

//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     /* ==========================================================
//        1. BUILD FILTER
//     ========================================================== */
//     let filter = {};

//     if (includeVariants === "false") filter.isVariant = false;

//     if (gender) filter.gender = new RegExp(gender, "i");

//     if (category) {
//       const arr = Array.isArray(category) ? category : category.split(",");
//       filter.category = { $in: arr.map((c) => new RegExp(`^${c}$`, "i")) };
//     }

//     if (subCategory) {
//       const arr = Array.isArray(subCategory) ? subCategory : subCategory.split(",");
//       filter.subCategory = { $in: arr.map((c) => new RegExp(c, "i")) };
//     }

//     if (search) {
//       const regex = new RegExp(search, "i");
//       filter.$or = [{ name: regex }, { description: regex }];
//     }

//     /* ==========================================================
//        2. FETCH MAIN PRODUCTS
//     ========================================================== */
//     const mains = await Ornament.find(filter).lean();

//     /* Collect IDs of all variants */
//     const variantIds = [];

//     mains.forEach((item) => {
//       if (!item.isVariant && item.variants) {
//         Object.values(item.variants).forEach((id) => variantIds.push(id));
//       }
//     });

//     /* Fetch variants in one query */
//     const variants = await Ornament.find({
//       _id: { $in: variantIds },
//     }).lean();

//     /* Build map for quick access */
//     const variantMap = {};
//     variants.forEach((v) => {
//       variantMap[v._id.toString()] = v;
//     });

//     /* ==========================================================
//        3. TRANSFORM OUTPUT (FAST)
//     ========================================================== */
//     let output = [];

//     for (let product of mains) {
//       if (!product.isVariant) {
//         const variantIds = Object.values(product.variants || {});
//         const theseVariants = variantIds.map((id) => variantMap[id.toString()]).filter(Boolean);

//         const converted = theseVariants.map((v) => {
//           let price = v.price;
//           let making = v.makingCharges;
//           let symbol = selectedCurrency.symbol;

//           // Currency override
//           if (v.prices?.[curr]) {
//             price = v.prices[curr].amount;
//             symbol = v.prices[curr].symbol;
//           } else {
//             price = Number((price * selectedCurrency.rate).toFixed(2));
//           }

//           if (v.makingChargesByCountry?.[curr]) {
//             making = v.makingChargesByCountry[curr].amount;
//           } else {
//             making = Number((making * selectedCurrency.rate).toFixed(2));
//           }

//           const total = Number((price + making).toFixed(2));

//           return {
//             ...v,
//             displayPrice: total,
//             currency: symbol,
//           };
//         });

//         const startingPrice =
//           converted.length > 0
//             ? Math.min(...converted.map((v) => v.displayPrice))
//             : null;

//         output.push({
//           ...product,
//           variants: converted,
//           startingPrice,
//           currency: selectedCurrency.symbol,
//         });
//       } else if (includeVariants === "true") {
//         // Show variants separately if asked
//         let price = product.price;
//         let symbol = selectedCurrency.symbol;

//         if (product.prices?.[curr]) {
//           price = product.prices[curr].amount;
//           symbol = product.prices[curr].symbol;
//         } else {
//           price = Number((price * selectedCurrency.rate).toFixed(2));
//         }

//         output.push({
//           ...product,
//           displayPrice: price,
//           currency: symbol,
//         });
//       }
//     }

//     /* ==========================================================
//        4. SORTING
//     ========================================================== */
//     if (sort === "price_asc")
//       output.sort((a, b) => (a.startingPrice || Infinity) - (b.startingPrice || Infinity));

//     if (sort === "price_desc")
//       output.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));

//     if (sort === "newest")
//       output.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//     if (sort === "oldest")
//       output.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

//     /* ==========================================================
//        5. SEND RESPONSE
//     ========================================================== */
//     res.json({
//       success: true,
//       count: output.length,
//       ornaments: output,
//     });

//   } catch (err) {
//     console.error("❌ Error fetching ornaments:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch ornaments",
//       error: err.message,
//     });
//   }
// });

// router.get("/ornaments", async (req, res) => {
//   try {
//     const {
//       gender,
//       category,
//       subCategory,
//       search,
//       sort,
//       currency = "INR",
//       includeVariants = "false",
//     } = req.query;

//     const curr = currency.toUpperCase();
//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     let filter = {};
//     if (includeVariants === "false") filter.isVariant = false;
//     if (gender) filter.gender = new RegExp(gender, "i");

//     if (category) {
//       const arr = category.split(",");
//       filter.category = { $in: arr.map((c) => new RegExp(`^${c}$`, "i")) };
//     }

//     if (subCategory) {
//       const arr = subCategory.split(",");
//       filter.subCategory = { $in: arr.map((c) => new RegExp(c, "i")) };
//     }

//     if (search) {
//       const regex = new RegExp(search, "i");
//       filter.$or = [{ name: regex }, { description: regex }];
//     }

//     const mains = await Ornament.find(filter).lean();

//     const variantIds = [];
//     mains.forEach((p) => {
//       if (!p.isVariant && p.variants) {
//         Object.values(p.variants).forEach((id) => variantIds.push(id));
//       }
//     });

//     const variants = await Ornament.find({ _id: { $in: variantIds } }).lean();
//     const variantMap = Object.fromEntries(
//       variants.map((v) => [v._id.toString(), v])
//     );

//     const output = mains.map((product) => {
//       if (!product.isVariant) {
//         const productVariants = Object.values(product.variants || {})
//           .map((id) => variantMap[id.toString()])
//           .filter(Boolean)
//           .map((v) => {
//             let price = v.prices?.[curr]?.amount ?? v.price * selectedCurrency.rate;
//             let making =
//               v.makingChargesByCountry?.[curr]?.amount ??
//               v.makingCharges * selectedCurrency.rate;

//             const total = Number((price + making).toFixed(2));

//             return {
//               ...v,
//               displayPrice: total,
//               currency: selectedCurrency.symbol,
//             };
//           });

//         return {
//           ...product,
//           variants: productVariants,
//           startingPrice:
//             productVariants.length > 0
//               ? Math.min(...productVariants.map((v) => v.displayPrice))
//               : null,
//           currency: selectedCurrency.symbol,
//         };
//       }

//       return null;
//     }).filter(Boolean);

//     res.json({ success: true, count: output.length, ornaments: output });
//   } catch (err) {
//     console.error("❌ Ornament List Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });



// router.get("/ornaments", async (req, res) => {
//   try {
//     const {
//       gender,
//       category,
//       subCategory,
//       search,
//       sort,
//       currency = "INR",
//       includeVariants = "false",
//     } = req.query;

//     const curr = currency.toUpperCase();
//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     let filter = {};
//     if (includeVariants === "false") filter.isVariant = false;
//     if (gender) filter.gender = new RegExp(gender, "i");

//     if (category) {
//       const arr = category.split(",");
//       filter.category = { $in: arr.map((c) => new RegExp(`^${c}$`, "i")) };
//     }

//     if (subCategory) {
//       const arr = subCategory.split(",");
//       filter.subCategory = { $in: arr.map((c) => new RegExp(c, "i")) };
//     }

//     if (search) {
//       const regex = new RegExp(search, "i");
//       filter.$or = [{ name: regex }, { description: regex }];
//     }

//     const mains = await Ornament.find(filter).lean();

//     const variantIds = [];
//     mains.forEach((p) => {
//       if (!p.isVariant && p.variants) {
//         Object.values(p.variants).forEach((id) => variantIds.push(id));
//       }
//     });

//     const variants = await Ornament.find({ _id: { $in: variantIds } }).lean();
//     const variantMap = Object.fromEntries(
//       variants.map((v) => [v._id.toString(), v])
//     );

//     const output = mains.map((product) => {
//       if (!product.isVariant) {
//         const productVariants = Object.values(product.variants || {})
//           .map((id) => variantMap[id.toString()])
//           .filter(Boolean)
//           .map((v) => {
//             let price = v.prices?.[curr]?.amount ?? v.price * selectedCurrency.rate;
//             let making =
//               v.makingChargesByCountry?.[curr]?.amount ??
//               v.makingCharges * selectedCurrency.rate;

//             const total = Number((price + making).toFixed(2));

//             return {
//               ...v,
//               displayPrice: total,
//               currency: selectedCurrency.symbol,
//             };
//           });

//         return {
//           ...product,
//           variants: productVariants,
//           startingPrice:
//             productVariants.length > 0
//               ? Math.min(...productVariants.map((v) => v.displayPrice))
//               : null,
//           currency: selectedCurrency.symbol,
//         };
//       }

//       return null;
//     }).filter(Boolean);

//     res.json({ success: true, count: output.length, ornaments: output });
//   } catch (err) {
//     console.error("❌ Ornament List Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

router.get("/ornaments", async (req, res) => {
  try {
    const {
      gender,
      category,
      subCategory,
      search,
      sort,
      currency = "INR",
      includeVariants = "false",
    } = req.query;

    const currencyRates = {
      INR: { rate: 1, symbol: "₹" },
      USD: { rate: 0.012, symbol: "$" },
      GBP: { rate: 0.0095, symbol: "£" },
      CAD: { rate: 0.016, symbol: "CA$" },
      EUR: { rate: 0.011, symbol: "€" },
      AED: { rate: 0.009, symbol: "د.إ" },
      AUD: { rate: 0.018, symbol: "A$" },
      SGD: { rate: 0.016, symbol: "S$" },
      JPY: { rate: 1.8, symbol: "¥" },
    };

    const curr = currency.toUpperCase();
    const selectedCurrency = currencyRates[curr] || currencyRates.INR;

    /* ================= FILTER ================= */

    let filter = {};

    if (includeVariants === "false") filter.isVariant = false;
    if (gender) filter.gender = new RegExp(gender, "i");

    if (category) {
      const arr = category.split(",");
      filter.category = { $in: arr.map((c) => new RegExp(`^${c}$`, "i")) };
    }

    if (subCategory) {
      const arr = subCategory.split(",");
      filter.subCategory = { $in: arr.map((c) => new RegExp(c, "i")) };
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }, { description: regex }];
    }

    /* ================= FETCH PRODUCTS ================= */

    const mains = await Ornament.find(filter).lean();

    /* ================= FETCH PRICING ================= */

    const pricing = await Pricing.findOne();
    if (!pricing) {
      return res.status(500).json({
        success: false,
        message: "Pricing not configured",
      });
    }

    /* ================= PRICE CALCULATOR ================= */

    const calculateBasePrice = (item) => {
      const weight = Number(item.metal?.weight || 0);

      let purity =
        item.metal?.purity ||
        item.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
        null;

      if (purity) purity = purity.toUpperCase().trim();

      let metalTotal = 0;

      if (purity) {
        const goldRate = pricing.goldPrices?.get(purity) || 0;
        metalTotal = goldRate * weight;
      }

      if (item.metal?.metalType === "Platinum") {
        metalTotal =
          weight * Number(pricing.platinumPricePerGram || 0);
      }

      if (item.metal?.metalType === "925 Sterling Silver") {
        metalTotal =
          weight * Number(pricing.silver925PricePerGram || 0);
      }

      const diamondTotal =
        Number(item.mainDiamondTotal || 0) +
        Number(item.sideDiamondTotal || 0);

      const gemstonesTotal = (item.gemstoneDetails || []).reduce(
        (sum, st) => {
          const rate = pricing.gemstonePrices?.[st.stoneType] || 0;
          return sum + rate * (st.carat || 0) * (st.count || 1);
        },
        0
      );

      return metalTotal + diamondTotal + gemstonesTotal;
    };

    /* ================= FETCH VARIANTS ================= */

    const variantIds = [];
    mains.forEach((p) => {
      if (!p.isVariant && p.variants) {
        Object.values(p.variants).forEach((id) =>
          variantIds.push(id)
        );
      }
    });

    const variants = await Ornament.find({
      _id: { $in: variantIds },
    }).lean();

    const variantMap = Object.fromEntries(
      variants.map((v) => [v._id.toString(), v])
    );

    /* ================= TRANSFORM OUTPUT ================= */

    const output = mains
      .map((product) => {
        if (!product.isVariant) {
          const productVariants = Object.values(product.variants || {})
            .map((id) => variantMap[id.toString()])
            .filter(Boolean)
            .map((v) => {
              const basePriceINR = calculateBasePrice(v);

              const rate = selectedCurrency.rate;

              const convertedBase =
                v.prices?.[curr]?.amount ??
                basePriceINR * rate;

              const convertedMaking =
                v.makingChargesByCountry?.[curr]?.amount ??
                Number(v.makingCharges || 0) * rate;

              const total = Number(
                (convertedBase + convertedMaking).toFixed(2)
              );

              return {
                ...v,
                basePrice: basePriceINR,
                displayPrice: total,
                currency: selectedCurrency.symbol,
              };
            });

          return {
            ...product,
            variants: productVariants,
            startingPrice:
              productVariants.length > 0
                ? Math.min(
                    ...productVariants.map(
                      (v) => v.displayPrice
                    )
                  )
                : null,
            currency: selectedCurrency.symbol,
          };
        }

        return null;
      })
      .filter(Boolean);

    res.json({
      success: true,
      count: output.length,
      ornaments: output,
    });
  } catch (err) {
    console.error("❌ Ornament List Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});



    
   

    

/**
/**
 * 🔹 Get single ornament details (public route)
 */
// router.get("/ornaments/:id", async (req, res) => {
//   try {
//     const { currency = "INR" } = req.query;
//     const curr = currency.toUpperCase();

//     // Currency rates
//     const currencyRates = {
//       INR: { rate: 1, symbol: "₹" },
//       USD: { rate: 0.012, symbol: "$" },
//       GBP: { rate: 0.0095, symbol: "£" },
//       CAD: { rate: 0.016, symbol: "CA$" },
//       EUR: { rate: 0.011, symbol: "€" },
//     };
//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     // Validate ID
//     const ornamentId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(ornamentId)) {
//       return res.status(400).json({ success: false, message: "Invalid ornament ID" });
//     }

//     // Fetch ornament
//     const ornament = await Ornament.findById(ornamentId).lean();
//     if (!ornament) {
//       return res.status(404).json({ success: false, message: "Ornament not found" });
//     }

//     /* ==========================================================
//        HELPER: Convert any product's price
//     ========================================================== */
//     const convertPrice = (item) => {
//       let price = item.price || 0;
//       let making = item.makingCharges || 0;
//       let symbol = selectedCurrency.symbol;

//       // Handle custom price by currency
//       if (item.prices?.[curr]) {
//         price = item.prices[curr].amount;
//         symbol = item.prices[curr].symbol;
//       } else {
//         price = Number((price * selectedCurrency.rate).toFixed(2));
//       }

//       // Handle country making charges
//       if (item.makingChargesByCountry?.[curr]) {
//         making = item.makingChargesByCountry[curr].amount;
//       } else {
//         making = Number((making * selectedCurrency.rate).toFixed(2));
//       }

//       const total = Number((price + making).toFixed(2));

//       const original = item.originalPrice || item.price || price;
//       const discount =
//         item.discount ||
//         (original > price
//           ? Math.round(((original - price) / original) * 100)
//           : 0);

//       return {
//         price,
//         making,
//         total,
//         symbol,
//         original,
//         discount,
//       };
//     };

//     /* ==========================================================
//        CASE 1 → VARIANT PRODUCT
//     ========================================================== */
//     if (ornament.isVariant) {
//       const converted = convertPrice(ornament);

//       return res.json({
//         success: true,
//         type: "variant",
//         ornament: {
//           ...ornament,
//           displayPrice: converted.price,
//           convertedMakingCharge: converted.making,
//           totalConvertedPrice: converted.total,
//           currency: converted.symbol,
//           originalPrice: converted.original,
//           discount: converted.discount,
//           metal: ornament.metal,
//           stones: ornament.stones || [],
//           images: ornament.images || [],
//           coverImage: ornament.coverImage || null,
//           model3D: ornament.model3D || null,
//           videoUrl: ornament.videoUrl || null,
//         },
//       });
//     }

//     /* ==========================================================
//        CASE 2 → MAIN PRODUCT
//        Fetch all variants and convert their prices
//     ========================================================== */
//     const variants = await Ornament.find({
//       parentProduct: ornament._id,
//       isVariant: true,
//     }).lean();

//     // Convert prices for all variants
//     const convertedVariants = variants.map((v) => {
//       const converted = convertPrice(v);

//       return {
//         ...v,
//         displayPrice: converted.price,
//         convertedMakingCharge: converted.making,
//         totalConvertedPrice: converted.total,
//         currency: converted.symbol,
//         originalPrice: converted.original,
//         discount: converted.discount,
//       };
//     });

//     // Starting price = lowest total price among variants
//     const startingPrice =
//       convertedVariants.length > 0
//         ? Math.min(...convertedVariants.map((v) => v.totalConvertedPrice))
//         : null;

//     return res.json({
//       success: true,
//       type: "main",
//       ornament: {
//         ...ornament,
//         currency: selectedCurrency.symbol,
//         variants: convertedVariants,
//         startingPrice,
//         metal: ornament.metal,
//         stones: ornament.stones || [],
//         images: ornament.images || [],
//         coverImage: ornament.coverImage || null,
//         model3D: ornament.model3D || null,
//         videoUrl: ornament.videoUrl || null,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Get Ornament Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch ornament",
//       error: error.message,
//     });
//   }
// });


// router.get("/ornaments/:id", async (req, res) => {
//   try {
//     const { currency = "INR" } = req.query;
//     const curr = currency.toUpperCase();

//     const currencyRates = {
//       INR: { rate: 1, symbol: "₹" },
//       USD: { rate: 0.012, symbol: "$" },
//       GBP: { rate: 0.0095, symbol: "£" },
//       CAD: { rate: 0.016, symbol: "CA$" },
//       EUR: { rate: 0.011, symbol: "€" },
//       AED: { rate: 0.009, symbol: "د.إ" },
//       AUD: { rate: 0.018, symbol: "A$" },
//       SGD: { rate: 0.016, symbol: "S$" },
//       JPY: { rate: 1.8, symbol: "¥" },
//     };

//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     const ornamentId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(ornamentId)) {
//       return res.status(400).json({ success: false, message: "Invalid ornament ID" });
//     }

//     let ornament = await Ornament.findById(ornamentId).lean();
//     if (!ornament) {
//       return res.status(404).json({ success: false, message: "Ornament not found" });
//     }

//     /* -----------------------------------------------------------
//        FIX 1: NORMALIZE OBJECT-BASED VARIANT IDS
//        ex: { "925 Sterling Silver": ObjectId("..") }
//     ------------------------------------------------------------*/
//     const normalVariantIds = [];

//     if (ornament.variants && typeof ornament.variants === "object" && !Array.isArray(ornament.variants)) {
//       for (const key in ornament.variants) {
//         const value = ornament.variants[key];

//         let idString = null;

//         if (value && typeof value === "object" && value._bsontype === "ObjectId") {
//           idString = value.toString();
//         } else if (typeof value === "string") {
//           idString = value;
//         } else if (value?.$oid) {
//           idString = value.$oid;
//         }

//         if (idString && mongoose.Types.ObjectId.isValid(idString)) {
//           normalVariantIds.push(idString);
//         }
//       }
//     }

//     /* -----------------------------------------------------------
//        PRICE CONVERTER
//     ------------------------------------------------------------*/
//     const convertPrice = (item) => {
//       let price = item.price || 0;
//       let making = item.makingCharges || 0;
//       let symbol = selectedCurrency.symbol;

//       // DB_OVERRIDE price
//       if (item.prices?.[curr]) {
//         price = Number(item.prices[curr].amount);
//         symbol = item.prices[curr].symbol || symbol;
//       } else {
//         price = Number((price * selectedCurrency.rate).toFixed(2));
//       }

//       // DB_OVERRIDE making
//       if (item.makingChargesByCountry?.[curr]) {
//         making = Number(item.makingChargesByCountry[curr].amount);
//       } else {
//         making = Number((making * selectedCurrency.rate).toFixed(2));
//       }

//       const total = Number((price + making).toFixed(2));
//       const original = item.originalPrice || item.price || price;
//       const discount =
//         item.discount ||
//         (original > price ? Math.round(((original - price) / original) * 100) : 0);

//       return { price, making, total, symbol, original, discount };
//     };

//     /* ==========================================================
//        CASE 1 — VARIANT PRODUCT ITSELF
//     ==========================================================*/
//     if (ornament.isVariant) {
//       const converted = convertPrice(ornament);

//       return res.json({
//         success: true,
//         type: "variant",
//         ornament: {
//           ...ornament,
//           displayPrice: converted.price,
//           convertedMakingCharge: converted.making,
//           totalConvertedPrice: converted.total,
//           currency: converted.symbol,
//           originalPrice: converted.original,
//           discount: converted.discount,
//         },
//       });
//     }

//     /* ==========================================================
//        CASE 2 — MAIN PRODUCT
//        Fetch variants in 2 ways:
//        1) From linked object-based variants
//        2) From children: parentProduct = ornament._id
//     ==========================================================*/

//     // 1) Fetch object-based variants
//     let objectBasedVariants = [];
//     if (normalVariantIds.length > 0) {
//       objectBasedVariants = await Ornament.find({ _id: { $in: normalVariantIds } }).lean();
//     }

//     // 2) Fetch child variants
//     const childVariants = await Ornament.find({
//       parentProduct: ornament._id,
//       isVariant: true,
//     }).lean();

//     // Merge without duplicates
//     const mergedVariants = [
//       ...objectBasedVariants,
//       ...childVariants.filter((cv) => 
//         !objectBasedVariants.some((ov) => ov._id.toString() === cv._id.toString())
//       )
//     ];

//     // Convert each variant
//     const convertedVariants = mergedVariants.map((variant) => {
//       const c = convertPrice(variant);
//       return {
//         ...variant,
//         displayPrice: c.price,
//         convertedMakingCharge: c.making,
//         totalConvertedPrice: c.total,
//         currency: c.symbol,
//         originalPrice: c.original,
//         discount: c.discount,
//       };
//     });

//     const startingPrice =
//       convertedVariants.length > 0
//         ? Math.min(...convertedVariants.map((v) => v.totalConvertedPrice))
//         : null;

//     const convertedMain = convertPrice(ornament);

//     return res.json({
//       success: true,
//       type: "main",
//       ornament: {
//         ...ornament,
//         currency: convertedMain.symbol,
//         displayPrice: convertedMain.price,
//         convertedMakingCharge: convertedMain.making,
//         totalConvertedPrice: convertedMain.total,
//         originalPrice: convertedMain.original,
//         discount: convertedMain.discount,
//         variants: convertedVariants,
//         startingPrice,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Get Ornament Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch ornament",
//       error: error.message,
//     });
//   }
// });

// router.get("/ornaments/:id", async (req, res) => {
//   try {
//     const { currency = "INR" } = req.query;
//     const curr = currency.toUpperCase();

//     const currencyRates = {
//       INR: { rate: 1, symbol: "₹" },
//       USD: { rate: 0.012, symbol: "$" },
//       GBP: { rate: 0.0095, symbol: "£" },
//       CAD: { rate: 0.016, symbol: "CA$" },
//       EUR: { rate: 0.011, symbol: "€" },
//       AED: { rate: 0.009, symbol: "د.إ" },
//       AUD: { rate: 0.018, symbol: "A$" },
//       SGD: { rate: 0.016, symbol: "S$" },
//       JPY: { rate: 1.8, symbol: "¥" },
//     };

//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     const ornamentId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(ornamentId)) {
//       return res.status(400).json({ success: false, message: "Invalid ornament ID" });
//     }

//     let ornament = await Ornament.findById(ornamentId).lean();

//     console.log("🔍 Fetched Ornament:", ornament);



// // 🟢 FULLY NORMALIZE metal for pricing
// ornament.metal = {
//   weight: Number(ornament.metal?.weight || 0),
//   purity: ornament.metal?.purity || ornament.purity || null,
//   metalType: ornament.metal?.metalType || ornament.metalType || ""
// };

// console.log("🧪 NORMALIZED METAL:", ornament.metal);




// // ⭐ Same for diamonds
// ornament.diamondDetails = ornament.diamondDetails || {};
// ornament.sideDiamondDetails = ornament.sideDiamondDetails || [];
// ornament.gemstoneDetails = ornament.gemstoneDetails || [];



//     if (!ornament) {
//       return res.status(404).json({ success: false, message: "Ornament not found" });
//     }

//     /* -----------------------------------------------------------
//        FIX 1: NORMALIZE OBJECT-BASED VARIANT IDS
//        ex: { "925 Sterling Silver": ObjectId("..") }
//     ------------------------------------------------------------*/
//     const normalVariantIds = [];

//     if (ornament.variants && typeof ornament.variants === "object" && !Array.isArray(ornament.variants)) {
//       for (const key in ornament.variants) {
//         const value = ornament.variants[key];

//         let idString = null;

//         if (value && typeof value === "object" && value._bsontype === "ObjectId") {
//           idString = value.toString();
//         } else if (typeof value === "string") {
//           idString = value;
//         } else if (value?.$oid) {
//           idString = value.$oid;
//         }

//         if (idString && mongoose.Types.ObjectId.isValid(idString)) {
//           normalVariantIds.push(idString);
//         }
//       }
//     }

//     /* -----------------------------------------------------------
//        PRICE CONVERTER
//     ------------------------------------------------------------*/
//     const convertPrice = (item) => {
//       let price = item.price || 0;
//       let making = item.makingCharges || 0;
//       let symbol = selectedCurrency.symbol;

//       // DB_OVERRIDE price
//       if (item.prices?.[curr]) {
//         price = Number(item.prices[curr].amount);
//         symbol = item.prices[curr].symbol || symbol;
//       } else {
//         price = Number((price * selectedCurrency.rate).toFixed(2));
//       }

//       // DB_OVERRIDE making
//       if (item.makingChargesByCountry?.[curr]) {
//         making = Number(item.makingChargesByCountry[curr].amount);
//       } else {
//         making = Number((making * selectedCurrency.rate).toFixed(2));
//       }

//       const total = Number((price + making).toFixed(2));
//       const original = item.originalPrice || item.price || price;
//       const discount =
//         item.discount ||
//         (original > price ? Math.round(((original - price) / original) * 100) : 0);

//       return { price, making, total, symbol, original, discount };
//     };

  
// //-------------------------------------------------------
// //  PRICE BREAKDOWN CALCULATOR (GOLD + DIAMONDS + STONES)
// //-------------------------------------------------------
// const calculateTotals = async (item) => {
//   const pricing = await Pricing.findOne();
//   if (!pricing) {
//     return {
//       goldTotal: 0,
//       mainDiamondTotal: 0,
//       sideDiamondTotal: 0,
//       gemstonesTotal: 0,
//       basePrice: 0
//     };
//   }

//   let goldTotal = 0;
//   let mainDiamondTotal = 0;
//   let sideDiamondTotal = 0;
//   let gemstonesTotal = 0;

//   // =============================
//   // 🔥 GOLD — supports 14K / 18K / 22K / 24K
//   // =============================
//   let purity = null;

//   // direct purity
//   if (item.metal?.purity) purity = item.metal.purity.trim();

//   // extract from metalType e.g. "14K Yellow Gold"
//   if (!purity && item.metal?.metalType) {
//     const match = item.metal.metalType.match(/(\d{2}K)/i);
//     if (match) purity = match[1].toUpperCase();
//   }

//   // fallback to item.purity
//   if (!purity && item.purity) purity = item.purity.trim();

// const rate = pricing.goldPrices.get(purity) || 0;

//   const weight = Number(item.metal?.weight || 0);

//   goldTotal = rate * weight;

//   // =============================
//   // 💎 MAIN DIAMOND
//   // =============================
//   if (item.diamondDetails) {
//     const d = item.diamondDetails;
//     const r = d.pricePerCarat || pricing.diamondPricePerCarat || 0;
//     mainDiamondTotal = (d.carat || 0) * (d.count || 0) * r;
//   }

//   // =============================
//   // ✨ SIDE DIAMONDS
//   // =============================
//   if (Array.isArray(item.sideDiamondDetails)) {
//     sideDiamondTotal = item.sideDiamondDetails.reduce((sum, sd) => {
//       const r = sd.pricePerCarat || pricing.diamondPricePerCarat || 0;
//       return sum + (sd.carat || 0) * (sd.count || 0) * r;
//     }, 0);
//   }

//   // =============================
//   // GEMSTONES
//   // =============================
//   if (Array.isArray(item.gemstoneDetails)) {
//     gemstonesTotal = item.gemstoneDetails.reduce((sum, st) => {
//       const r = pricing.gemstonePrices?.[st.stoneType] || 0;
//       return sum + (st.carat || 0) * (st.count || 1) * r;
//     }, 0);
//   }

//   return {
//     goldTotal,
//     mainDiamondTotal,
//     sideDiamondTotal,
//     gemstonesTotal,
//     basePrice: goldTotal + mainDiamondTotal + sideDiamondTotal + gemstonesTotal
//   };
// };


// const convertUsingDB = (item, curr, totals) => {
//   const rate = currencyRates[curr]?.rate || 1;
//   const symbol = currencyRates[curr]?.symbol || "₹";

//   // Price override (DB)
//   const dbPrice = item.prices?.[curr]?.amount;
//   const displayPrice =
//     dbPrice !== undefined && dbPrice !== null
//       ? Number(dbPrice)
//       : totals.basePrice * rate;

//   // Making charges override (DB)
//   const dbMaking = item.makingChargesByCountry?.[curr]?.amount;
//   const convertedMakingCharge =
//     dbMaking !== undefined && dbMaking !== null
//       ? Number(dbMaking)
//       : Number(item.makingCharges || 0) * rate;

//   return {
//     ...item,
//     ...totals,

//     displayPrice,
//     convertedMakingCharge,
//     totalConvertedPrice: displayPrice + convertedMakingCharge,

//     currency: symbol,
//     priceSource: dbPrice ? "DB" : "AUTO",
//     makingSource: dbMaking ? "DB" : "AUTO",
//   };
// };

 




 

// if (ornament.isVariant) {
  
//   const converted = convertUsingDB(ornament, curr);

//   return res.json({
//     success: true,
//     type: "variant",
//     ornament: converted
//   });
// }




   

//     // 1) Fetch object-based variants
//     let objectBasedVariants = [];
//     if (normalVariantIds.length > 0) {
//       objectBasedVariants = await Ornament.find({ _id: { $in: normalVariantIds } }).lean();
//     }

//     // 2) Fetch child variants
//     const childVariants = await Ornament.find({
//       parentProduct: ornament._id,
//       isVariant: true,
//     }).lean();

//     // Merge without duplicates
//     const mergedVariants = [
//       ...objectBasedVariants,
//       ...childVariants.filter((cv) => 
//         !objectBasedVariants.some((ov) => ov._id.toString() === cv._id.toString())
//       )
//     ];

// // Convert each variant
// // Convert each variant
// const convertedVariants = await Promise.all(
//   mergedVariants.map(async (variant) => {
//     variant.metal = variant.metal || {
//       metalType: variant.metalType,
//       purity: variant.purity,
//       weight: variant.weight,
//     };

  
//     const totalsVariant = await calculateTotals(variant);
// const converted = convertUsingDB(variant, curr, totalsVariant);
//  // FIXED
//     return converted;
//   })
// );

// // Starting price
// const startingPrice =
//   convertedVariants.length > 0
//     ? Math.min(...convertedVariants.map((v) => v.totalConvertedPrice))
//     : null;

// // Main product totals + conversion
// const totals = await calculateTotals(ornament);

// console.log(" GOLD TOTAL:", totals.goldTotal);
// console.log(" MAIN DIAMOND TOTAL:", totals.mainDiamondTotal);
// console.log(" SIDE DIAMOND TOTAL:", totals.sideDiamondTotal);
// console.log(" BASE PRICE:", totals.basePrice);

// const convertedMain = convertUsingDB(ornament, curr, totals);

// console.log(" MAIN PRODUCT CONVERTED:", convertedMain);


// return res.json({
//   success: true,
//   type: "main",
//   ornament: {
//     ...convertedMain,   // FIXED
//     variants: convertedVariants,
//     startingPrice,
//   }
// });




//   } catch (error) {

   
//     console.error("❌ FULL Backend Error:", error);

//     return res.status(500).json({
      
//       success: false,
//       message: "Failed to fetch ornament",
//       error: error.message,
//     });
//   }
// });

// router.get("/ornaments/:id", async (req, res) => {
//   try {
//     const { currency = "INR" } = req.query;
//     const curr = currency.toUpperCase();

//     const currencyRates = {
//       INR: { rate: 1, symbol: "₹" },
//       USD: { rate: 0.012, symbol: "$" },
//       GBP: { rate: 0.0095, symbol: "£" },
//       CAD: { rate: 0.016, symbol: "CA$" },
//       EUR: { rate: 0.011, symbol: "€" },
//       AED: { rate: 0.009, symbol: "د.إ" },
//       AUD: { rate: 0.018, symbol: "A$" },
//       SGD: { rate: 0.016, symbol: "S$" },
//       JPY: { rate: 1.8, symbol: "¥" },
//     };

//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     const ornamentId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(ornamentId)) {
//       return res.status(400).json({ success: false, message: "Invalid ornament ID" });
//     }

//     const ornament = await Ornament.findById(ornamentId).lean();
//     if (!ornament) {
//       return res.status(404).json({ success: false, message: "Ornament not found" });
//     }

//     /* ================= NORMALIZE ================= */
//     ornament.metal = {
//       weight: Number(ornament.metal?.weight || 0),
//       purity: ornament.metal?.purity || ornament.purity || null,
//       metalType: ornament.metal?.metalType || ornament.metalType || "",
//     };

//     ornament.diamondDetails ||= {};
//     ornament.sideDiamondDetails ||= [];
//     ornament.gemstoneDetails ||= [];

//     /* ================= PRICING (FETCH ONCE) ================= */
//     const pricing = await Pricing.findOne();
//     if (!pricing) {
//       return res.status(500).json({ success: false, message: "Pricing not configured" });
//     }

//     /* ================= PRICE CALCULATOR ================= */
//     const calculateTotals = (item) => {
//       let goldTotal = 0;
//       let mainDiamondTotal = 0;
//       let sideDiamondTotal = 0;
//       let gemstonesTotal = 0;

//       let purity =
//         item.metal?.purity ||
//         item.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
//         item.purity ||
//         null;

//       if (purity) purity = purity.trim().toUpperCase();

//       const goldRate = pricing.goldPrices?.get(purity) || 0;
//       goldTotal = goldRate * Number(item.metal?.weight || 0);

//       if (item.diamondDetails) {
//         const r = item.diamondDetails.pricePerCarat || pricing.diamondPricePerCarat || 0;
//         mainDiamondTotal =
//           (item.diamondDetails.carat || 0) *
//           (item.diamondDetails.count || 0) *
//           r;
//       }

//       sideDiamondTotal = item.sideDiamondDetails.reduce((sum, sd) => {
//         const r = sd.pricePerCarat || pricing.diamondPricePerCarat || 0;
//         return sum + (sd.carat || 0) * (sd.count || 0) * r;
//       }, 0);

//       gemstonesTotal = item.gemstoneDetails.reduce((sum, st) => {
//         const r = pricing.gemstonePrices?.[st.stoneType] || 0;
//         return sum + (st.carat || 0) * (st.count || 1) * r;
//       }, 0);

//       return {
//         goldTotal,
//         mainDiamondTotal,
//         sideDiamondTotal,
//         gemstonesTotal,
//         basePrice: goldTotal + mainDiamondTotal + sideDiamondTotal + gemstonesTotal,
//       };
//     };

//     /* ================= CONVERTER ================= */
//     const convertUsingDB = (item, totals) => {
//       const rate = selectedCurrency.rate;
//       const symbol = selectedCurrency.symbol;

//       const dbPrice = item.prices?.[curr]?.amount;
//       const displayPrice =
//         dbPrice !== undefined ? Number(dbPrice) : totals.basePrice * rate;

//       const dbMaking = item.makingChargesByCountry?.[curr]?.amount;
//       const convertedMakingCharge =
//         dbMaking !== undefined
//           ? Number(dbMaking)
//           : Number(item.makingCharges || 0) * rate;

//       return {
//         ...item,
//         ...totals,
//         displayPrice,
//         convertedMakingCharge,
//         totalConvertedPrice: displayPrice + convertedMakingCharge,
//         currency: symbol,
//       };
//     };

//     /* ================= VARIANT ================= */
//     if (ornament.isVariant) {
//       const totalsVariant = calculateTotals(ornament);
//       const converted = convertUsingDB(ornament, totalsVariant);

//       return res.json({
//         success: true,
//         type: "variant",
//         ornament: converted,
//       });
//     }

//     /* ================= MAIN PRODUCT ================= */
//     const variants = await Ornament.find({
//       parentProduct: ornament._id,
//       isVariant: true,
//     }).lean();

//     const convertedVariants = variants.map((variant) => {
//       variant.metal ||= ornament.metal;
//       const totals = calculateTotals(variant);
//       return convertUsingDB(variant, totals);
//     });

//     const mainTotals = calculateTotals(ornament);
//     const convertedMain = convertUsingDB(ornament, mainTotals);

//     return res.json({
//       success: true,
//       type: "main",
//       ornament: {
//         ...convertedMain,
//         variants: convertedVariants,
//         startingPrice:
//           convertedVariants.length > 0
//             ? Math.min(...convertedVariants.map((v) => v.totalConvertedPrice))
//             : null,
//       },
//     });

//   } catch (error) {
//     console.error("❌ FULL Backend Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch ornament",
//       error: error.message,
//     });
//   }
// });


// router.get("/ornaments/:id", async (req, res) => {
//   try {
//     const { currency = "INR" } = req.query;
//     const curr = currency.toUpperCase();

//     const currencyRates = {
//       INR: { rate: 1, symbol: "₹" },
//       USD: { rate: 0.012, symbol: "$" },
//       GBP: { rate: 0.0095, symbol: "£" },
//       CAD: { rate: 0.016, symbol: "CA$" },
//       EUR: { rate: 0.011, symbol: "€" },
//       AED: { rate: 0.009, symbol: "د.إ" },
//       AUD: { rate: 0.018, symbol: "A$" },
//       SGD: { rate: 0.016, symbol: "S$" },
//       JPY: { rate: 1.8, symbol: "¥" },
//     };

//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     const ornamentId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(ornamentId)) {
//       return res.status(400).json({ success: false, message: "Invalid ornament ID" });
//     }

//     const ornament = await Ornament.findById(ornamentId).lean();
//     if (!ornament) {
//       return res.status(404).json({ success: false, message: "Ornament not found" });
//     }

//     /* ================= NORMALIZE ================= */
//     ornament.metal = {
//       weight: Number(ornament.metal?.weight || 0),
//       purity: ornament.metal?.purity || ornament.purity || null,
//       metalType: ornament.metal?.metalType || ornament.metalType || "",
//     };

//     ornament.diamondDetails ||= {};
//     ornament.sideDiamondDetails ||= [];
//     ornament.gemstoneDetails ||= [];

//     /* ================= PRICING (FETCH ONCE) ================= */
//     const pricing = await Pricing.findOne();
//     if (!pricing) {
//       return res.status(500).json({ success: false, message: "Pricing not configured" });
//     }

//     /* ================= PRICE CALCULATOR ================= */
//     const calculateTotals = (item) => {
//       let goldTotal = 0;
//       let mainDiamondTotal = 0;
//       let sideDiamondTotal = 0;
//       let gemstonesTotal = 0;

//       let purity =
//         item.metal?.purity ||
//         item.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
//         item.purity ||
//         null;

//       if (purity) purity = purity.trim().toUpperCase();

//       const goldRate = pricing.goldPrices?.get(purity) || 0;
//       goldTotal = goldRate * Number(item.metal?.weight || 0);

//       if (item.diamondDetails) {
//         const r = item.diamondDetails.pricePerCarat || pricing.diamondPricePerCarat || 0;
//         mainDiamondTotal =
//           (item.diamondDetails.carat || 0) *
//           (item.diamondDetails.count || 0) *
//           r;
//       }

//       sideDiamondTotal = item.sideDiamondDetails.reduce((sum, sd) => {
//         const r = sd.pricePerCarat || pricing.diamondPricePerCarat || 0;
//         return sum + (sd.carat || 0) * (sd.count || 0) * r;
//       }, 0);

//       gemstonesTotal = item.gemstoneDetails.reduce((sum, st) => {
//         const r = pricing.gemstonePrices?.[st.stoneType] || 0;
//         return sum + (st.carat || 0) * (st.count || 1) * r;
//       }, 0);

//       return {
//         goldTotal,
//         mainDiamondTotal,
//         sideDiamondTotal,
//         gemstonesTotal,
//         basePrice: goldTotal + mainDiamondTotal + sideDiamondTotal + gemstonesTotal,
//       };
//     };

//     /* ================= CONVERTER ================= */
//     const convertUsingDB = (item, totals) => {
//       const rate = selectedCurrency.rate;
//       const symbol = selectedCurrency.symbol;

//       const dbPrice = item.prices?.[curr]?.amount;
//       const displayPrice =
//         dbPrice !== undefined ? Number(dbPrice) : totals.basePrice * rate;

//       const dbMaking = item.makingChargesByCountry?.[curr]?.amount;
//       const convertedMakingCharge =
//         dbMaking !== undefined
//           ? Number(dbMaking)
//           : Number(item.makingCharges || 0) * rate;

//       return {
//         ...item,
//         ...totals,
//         displayPrice,
//         convertedMakingCharge,
//         totalConvertedPrice: displayPrice + convertedMakingCharge,
//         currency: symbol,
//       };
//     };

//     /* ================= VARIANT ================= */
//     if (ornament.isVariant) {
//       const totalsVariant = calculateTotals(ornament);
//       const converted = convertUsingDB(ornament, totalsVariant);

//       return res.json({
//         success: true,
//         type: "variant",
//         ornament: converted,
//       });
//     }

//     /* ================= MAIN PRODUCT ================= */
//     const variants = await Ornament.find({
//       parentProduct: ornament._id,
//       isVariant: true,
//     }).lean();

//     const convertedVariants = variants.map((variant) => {
//       variant.metal ||= ornament.metal;
//       const totals = calculateTotals(variant);
//       return convertUsingDB(variant, totals);
//     });

//     const mainTotals = calculateTotals(ornament);
//     const convertedMain = convertUsingDB(ornament, mainTotals);

//     return res.json({
//       success: true,
//       type: "main",
//       ornament: {
//         ...convertedMain,
//         variants: convertedVariants,
//         startingPrice:
//           convertedVariants.length > 0
//             ? Math.min(...convertedVariants.map((v) => v.totalConvertedPrice))
//             : null,
//       },
//     });

//   } catch (error) {
//     console.error(" FULL Backend Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch ornament",
//       error: error.message,
//     });
//   }
// });


// router.get("/ornaments/:id", async (req, res) => {
//   try {
//     const { currency = "INR" } = req.query;
//     const curr = currency.toUpperCase();

//     const currencyRates = {
//       INR: { rate: 1, symbol: "₹" },
//       USD: { rate: 0.012, symbol: "$" },
//       GBP: { rate: 0.0095, symbol: "£" },
//       CAD: { rate: 0.016, symbol: "CA$" },
//       EUR: { rate: 0.011, symbol: "€" },
//       AED: { rate: 0.009, symbol: "د.إ" },
//       AUD: { rate: 0.018, symbol: "A$" },
//       SGD: { rate: 0.016, symbol: "S$" },
//       JPY: { rate: 1.8, symbol: "¥" },
//     };

//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     const ornamentId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(ornamentId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid ornament ID" });
//     }

//     const ornament = await Ornament.findById(ornamentId).lean();
//     if (!ornament) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Ornament not found" });
//     }

//     /* ================= NORMALIZE ================= */
//     ornament.metal = {
//       weight: Number(ornament.metal?.weight || 0),
//       purity: ornament.metal?.purity || ornament.purity || null,
//       metalType: ornament.metal?.metalType || ornament.metalType || "",
//     };

//     ornament.diamondDetails ||= {};
//     ornament.sideDiamondDetails ||= [];
//     ornament.gemstoneDetails ||= [];

//     /* ================= PRICING (FETCH ONCE) ================= */
//     const pricing = await Pricing.findOne();
//     if (!pricing) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Pricing not configured" });
//     }

//     /* ================= PRICE CALCULATOR ================= */
//     const calculateTotals = (item) => {
//       let goldTotal = 0;
//       let mainDiamondTotal = 0;
//       let sideDiamondTotal = 0;
//       let gemstonesTotal = 0;

//       let purity =
//         item.metal?.purity ||
//         item.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
//         item.purity ||
//         null;

//       if (purity) purity = purity.trim().toUpperCase();

//       const goldRate = pricing.goldPrices?.get(purity) || 0;
//       goldTotal = goldRate * Number(item.metal?.weight || 0);

//       if (item.diamondDetails) {
//         const r =
//           item.diamondDetails.pricePerCarat ||
//           pricing.diamondPricePerCarat ||
//           0;
//         mainDiamondTotal =
//           (item.diamondDetails.carat || 0) *
//           (item.diamondDetails.count || 0) *
//           r;
//       }

//       sideDiamondTotal = item.sideDiamondDetails.reduce((sum, sd) => {
//         const r = sd.pricePerCarat || pricing.diamondPricePerCarat || 0;
//         return sum + (sd.carat || 0) * (sd.count || 0) * r;
//       }, 0);

//       gemstonesTotal = item.gemstoneDetails.reduce((sum, st) => {
//         const r = pricing.gemstonePrices?.[st.stoneType] || 0;
//         return sum + (st.carat || 0) * (st.count || 1) * r;
//       }, 0);

//       return {
//         goldTotal,
//         mainDiamondTotal,
//         sideDiamondTotal,
//         gemstonesTotal,
//         basePrice:
//           goldTotal + mainDiamondTotal + sideDiamondTotal + gemstonesTotal,
//       };
//     };

//     /* ================= CONVERTER ================= */
//     const convertUsingDB = (item, totals) => {
//       const rate = selectedCurrency.rate;
//       const symbol = selectedCurrency.symbol;

//       const dbPrice = item.prices?.[curr]?.amount;
//       const displayPrice =
//         dbPrice !== undefined ? Number(dbPrice) : totals.basePrice * rate;

//       const dbMaking = item.makingChargesByCountry?.[curr]?.amount;
//       const convertedMakingCharge =
//         dbMaking !== undefined
//           ? Number(dbMaking)
//           : Number(item.makingCharges || 0) * rate;

//       return {
//         ...item,
//         ...totals,
//         displayPrice,
//         convertedMakingCharge,
//         totalConvertedPrice: displayPrice + convertedMakingCharge,
//         currency: symbol,
//       };
//     };

//     /* ================= VARIANT PRODUCT ================= */
//     if (ornament.isVariant) {
//       const parent = await Ornament.findById(
//         ornament.parentProduct
//       ).lean();

//       let metalBases = [];

//       if (parent?.designCode) {
//         const siblings = await Ornament.find({
//           designCode: parent.designCode,
//           isVariant: false,
//         })
//           .select("_id metal.metalType")
//           .lean();

//         metalBases = siblings
//           .map((p) => {
//             const metalType = p.metal?.metalType || "";
//             const match = metalType.match(/(\d{2}K)/);
//             return match ? { id: p._id, purity: match[1] } : null;
//           })
//           .filter(Boolean);
//       }

//       const totalsVariant = calculateTotals(ornament);
//       const converted = convertUsingDB(ornament, totalsVariant);

//       return res.json({
//         success: true,
//         type: "variant",
//         ornament: {
//           ...converted,
//           metalBases,
//           currentPurity:
//             ornament.metal?.metalType?.match(/(\d{2}K)/)?.[1] || null,
//         },
//       });
//     }

//     /* ================= MAIN PRODUCT ================= */
//     let siblingBases = [];

//     if (ornament.designCode) {
//       siblingBases = await Ornament.find({
//         designCode: ornament.designCode,
//         isVariant: false,
//         _id: { $ne: ornament._id },
//       })
//         .select("_id metal.metalType")
//         .lean();
//     }

//     const variants = await Ornament.find({
//       parentProduct: ornament._id,
//       isVariant: true,
//     }).lean();

//     const convertedVariants = variants.map((variant) => {
//       variant.metal ||= ornament.metal;
//       const totals = calculateTotals(variant);
//       return convertUsingDB(variant, totals);
//     });

//     const mainTotals = calculateTotals(ornament);
//     const convertedMain = convertUsingDB(ornament, mainTotals);

//     return res.json({
//       success: true,
//       type: "main",
//       ornament: {
//         ...convertedMain,
//         variants: convertedVariants,
//         metalBases: siblingBases
//           .map((p) => {
//             const metalType = p.metal?.metalType || "";
//             const match = metalType.match(/(\d{2}K)/);
//             return match ? { id: p._id, purity: match[1] } : null;
//           })
//           .filter(Boolean),
//         currentPurity:
//           ornament.metal?.metalType?.match(/(\d{2}K)/)?.[1] || null,
//         startingPrice:
//           convertedVariants.length > 0
//             ? Math.min(
//                 ...convertedVariants.map(
//                   (v) => v.totalConvertedPrice
//                 )
//               )
//             : null,
//       },
//     });
//   } catch (error) {
//     console.error(" FULL Backend Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch ornament",
//       error: error.message,
//     });
//   }
// });


// router.get("/ornaments/:id", async (req, res) => {
//   try {
//     const { currency = "INR" } = req.query;
//     const curr = currency.toUpperCase();

//     const currencyRates = {
//       INR: { rate: 1, symbol: "₹" },
//       USD: { rate: 0.012, symbol: "$" },
//       GBP: { rate: 0.0095, symbol: "£" },
//       CAD: { rate: 0.016, symbol: "CA$" },
//       EUR: { rate: 0.011, symbol: "€" },
//       AED: { rate: 0.009, symbol: "د.إ" },
//       AUD: { rate: 0.018, symbol: "A$" },
//       SGD: { rate: 0.016, symbol: "S$" },
//       JPY: { rate: 1.8, symbol: "¥" },
//     };

//     const selectedCurrency = currencyRates[curr] || currencyRates.INR;

//     const ornamentId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(ornamentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid ornament ID",
//       });
//     }

//     const ornament = await Ornament.findById(ornamentId).lean();
//     if (!ornament) {
//       return res.status(404).json({
//         success: false,
//         message: "Ornament not found",
//       });
//     }

//     const pricing = await Pricing.findOne();
//     if (!pricing) {
//       return res.status(500).json({
//         success: false,
//         message: "Pricing not configured",
//       });
//     }

//     /* ================= BASE PRICE CALCULATOR ================= */

//     const calculateBasePrice = (item) => {
//       const weight = Number(item.metal?.weight || 0);

//       let purity =
//         item.metal?.purity ||
//         item.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
//         null;

//       if (purity) purity = purity.toUpperCase().trim();

//       let metalTotal = 0;

//       // GOLD
//       if (purity) {
//         const goldRate = pricing.goldPrices?.get(purity) || 0;
//         metalTotal = goldRate * weight;
//       }

//       // PLATINUM
//       if (item.metal?.metalType === "Platinum") {
//         metalTotal =
//           weight * Number(pricing.platinumPricePerGram || 0);
//       }

//       // SILVER
//       if (item.metal?.metalType === "925 Sterling Silver") {
//         metalTotal =
//           weight * Number(pricing.silver925PricePerGram || 0);
//       }

//       // DIAMONDS (Spreadsheet Authoritative)
//       const diamondTotal =
//         Number(item.mainDiamondTotal || 0) +
//         Number(item.sideDiamondTotal || 0);

//       // GEMSTONES
//       const gemstonesTotal = (item.gemstoneDetails || []).reduce(
//         (sum, st) => {
//           const rate = pricing.gemstonePrices?.[st.stoneType] || 0;
//           return sum + rate * (st.carat || 0) * (st.count || 1);
//         },
//         0
//       );

//       return metalTotal + diamondTotal + gemstonesTotal;
//     };

//     /* ================= CONVERSION ================= */

//     const convertPrice = (item) => {
//       const baseINR = calculateBasePrice(item);

//       const rate = selectedCurrency.rate;
//       const symbol = selectedCurrency.symbol;

//       const dbPrice = item.prices?.[curr]?.amount;
//       const displayPrice =
//         dbPrice !== undefined
//           ? Number(dbPrice)
//           : baseINR * rate;

//       const dbMaking = item.makingChargesByCountry?.[curr]?.amount;
//       const convertedMaking =
//         dbMaking !== undefined
//           ? Number(dbMaking)
//           : Number(item.makingCharges || 0) * rate;

//       return {
//         ...item,
//         basePrice: baseINR,
//         displayPrice,
//         convertedMakingCharge: convertedMaking,
//         totalConvertedPrice: displayPrice + convertedMaking,
//         currency: symbol,
//       };
//     };

//     /* ================= VARIANT PRODUCT ================= */

//     if (ornament.isVariant) {
//       const parent = await Ornament.findById(
//         ornament.parentProduct
//       ).lean();

//       let metalBases = [];

//       if (parent?.designCode) {
//         const siblings = await Ornament.find({
//           designCode: parent.designCode,
//           isVariant: false,
//         })
//           .select("_id metal.metalType")
//           .lean();

//         metalBases = siblings
//           .map((p) => {
//             const match =
//               p.metal?.metalType?.match(/(\d{2}K)/);
//             return match
//               ? { id: p._id, purity: match[1] }
//               : null;
//           })
//           .filter(Boolean);
//       }

//       const converted = convertPrice(ornament);

//       return res.json({
//         success: true,
//         type: "variant",
//         ornament: {
//           ...converted,
//           metalBases,
//           currentPurity:
//             ornament.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
//             null,
//         },
//       });
//     }

//     /* ================= MAIN PRODUCT ================= */

//     const variants = await Ornament.find({
//       parentProduct: ornament._id,
//       isVariant: true,
//     }).lean();

//     const convertedVariants = variants.map((variant) =>
//       convertPrice({
//         ...variant,
//         metal: variant.metal || ornament.metal,
//       })
//     );

//     const convertedMain = convertPrice(ornament);

//     return res.json({
//       success: true,
//       type: "main",
//       ornament: {
//         ...convertedMain,
//         variants: convertedVariants,
//         currentPurity:
//           ornament.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
//           null,
//         startingPrice:
//           convertedVariants.length > 0
//             ? Math.min(
//                 ...convertedVariants.map(
//                   (v) => v.totalConvertedPrice
//                 )
//               )
//             : null,
//       },
//     });
//   } catch (error) {
//     console.error("❌ FULL Backend Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch ornament",
//       error: error.message,
//     });
//   }
// });


router.get("/ornaments/:id", async (req, res) => {
    res.set("Cache-Control", "no-store");
  try {
    const { currency = "INR" } = req.query;
    const curr = currency.toUpperCase();

    const currencyRates = {
      INR: { rate: 1, symbol: "₹" },
      USD: { rate: 0.012, symbol: "$" },
      GBP: { rate: 0.0095, symbol: "£" },
      CAD: { rate: 0.016, symbol: "CA$" },
      EUR: { rate: 0.011, symbol: "€" },
      AED: { rate: 0.009, symbol: "د.إ" },
      AUD: { rate: 0.018, symbol: "A$" },
      SGD: { rate: 0.016, symbol: "S$" },
      JPY: { rate: 1.8, symbol: "¥" },
    };

    const selectedCurrency = currencyRates[curr] || currencyRates.INR;

    const ornamentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(ornamentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ornament ID",
      });
    }

    const ornament = await Ornament.findById(ornamentId).lean();
    if (!ornament) {
      return res.status(404).json({
        success: false,
        message: "Ornament not found",
      });
    }

//     let purityOptions = [];

// if (ornament.designCode) {
//   const sameDesignProducts = await Ornament.find({
//     designCode: ornament.designCode,
//   })
//     .select("_id metal.metalType")
//     .lean();

//   purityOptions = sameDesignProducts
//     .filter((p) => {
//       const metalType = p.metal?.metalType || "";

//       //  Allow only exact Gold (not White/Rose)
//       return (
//         (metalType === "14K Gold" || metalType === "18K Gold")
//       );
//     })
//     .map((p) => ({
//       id: p._id.toString(),
//       purity: p.metal?.metalType,
//     }));

//   console.log(" FINAL purityOptions:", purityOptions);
// }


    
let purityOptions = [];

const designCode =
  ornament.designCode ||
  (ornament.isVariant
    ? (await Ornament.findById(ornament.parentProduct).lean())?.designCode
    : null);

if (designCode) {
  const sameDesignProducts = await Ornament.find({
    designCode,
  })
    .select("_id metal.metalType")
    .lean();

  purityOptions = sameDesignProducts
    .filter((p) => {
      const metalType = p.metal?.metalType || "";
      return metalType === "14K Gold" || metalType === "18K Gold";
    })
    .map((p) => ({
      id: p._id.toString(),
      purity: p.metal?.metalType,
    }));
}



    const pricing = await Pricing.findOne();
    if (!pricing) {
      return res.status(500).json({
        success: false,
        message: "Pricing not configured",
      });
    }

    /* ================= BASE PRICE CALCULATOR ================= */

    const calculateBasePrice = (item) => {
      const weight = Number(item.metal?.weight || 0);

      let purity =
        item.metal?.purity ||
        item.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
        null;

      if (purity) purity = purity.toUpperCase().trim();

      let metalTotal = 0;

      // GOLD
      // if (purity) {
      //   const goldRate = pricing.goldPrices?.get(purity) || 0;
      //   metalTotal = goldRate * weight;
      // }

      if (purity) {
  console.log("-------- GOLD CALCULATION DEBUG --------");
  console.log("Purity detected:", purity);
  console.log("Weight:", weight);

  console.log("Type of goldPrices:", typeof pricing.goldPrices);
  console.log("goldPrices value:", pricing.goldPrices);

  const goldRateFromMap = pricing.goldPrices?.get?.(purity);
  const goldRateFromObject = pricing.goldPrices?.[purity];

  console.log("goldRate from Map:", goldRateFromMap);
  console.log("goldRate from Object:", goldRateFromObject);

  const goldRate =
    goldRateFromMap ||
    goldRateFromObject ||
    0;

  console.log("Final goldRate used:", goldRate);

  metalTotal = goldRate * weight;

  console.log("metalTotal (goldRate * weight):", metalTotal);
  console.log("---------------------------------------");
}


      // PLATINUM
      if (item.metal?.metalType === "Platinum") {
        metalTotal =
          weight * Number(pricing.platinumPricePerGram || 0);
      }

      // SILVER
      if (item.metal?.metalType === "925 Sterling Silver") {
        metalTotal =
          weight * Number(pricing.silver925PricePerGram || 0);
      }

      // DIAMONDS (Spreadsheet Authoritative)
      const diamondTotal =
        Number(item.mainDiamondTotal || 0) +
        Number(item.sideDiamondTotal || 0);

      // GEMSTONES
      const gemstonesTotal = (item.gemstoneDetails || []).reduce(
        (sum, st) => {
          const rate = pricing.gemstonePrices?.[st.stoneType] || 0;
          return sum + rate * (st.carat || 0) * (st.count || 1);
        },
        0
      );

      // return metalTotal + diamondTotal + gemstonesTotal;

      return {
  metalTotal,
  diamondTotal,
  gemstonesTotal,
  baseTotal: metalTotal + diamondTotal + gemstonesTotal,
};

    };

    /* ================= CONVERSION ================= */

    // const convertPrice = (item) => {
    //   const baseINR = calculateBasePrice(item);

    //   const rate = selectedCurrency.rate;
    //   const symbol = selectedCurrency.symbol;

    //   const dbPrice = item.prices?.[curr]?.amount;
    //   const displayPrice =
    //     dbPrice !== undefined
    //       ? Number(dbPrice)
    //       : baseINR * rate;

    //   const dbMaking = item.makingChargesByCountry?.[curr]?.amount;
    //   const convertedMaking =
    //     dbMaking !== undefined
    //       ? Number(dbMaking)
    //       : Number(item.makingCharges || 0) * rate;

    //   return {
    //     ...item,
    //     basePrice: baseINR,
    //     displayPrice,
    //     convertedMakingCharge: convertedMaking,
    //     totalConvertedPrice: displayPrice + convertedMaking,
    //     currency: symbol,
    //   };
    // };

    const convertPrice = (item) => {
  // 🔥 Get full breakdown object
  const breakdown = calculateBasePrice(item);

  const baseINR = breakdown.baseTotal;

  const rate = selectedCurrency.rate;
  const symbol = selectedCurrency.symbol;

  const dbPrice = item.prices?.[curr]?.amount;
  const displayPrice =
    dbPrice !== undefined
      ? Number(dbPrice)
      : baseINR * rate;

  const dbMaking = item.makingChargesByCountry?.[curr]?.amount;
  const convertedMaking =
    dbMaking !== undefined
      ? Number(dbMaking)
      : Number(item.makingCharges || 0) * rate;

  return {
    ...item,

    // 🔥 Attach breakdown values to response
    metalTotal: breakdown.metalTotal,
    mainDiamondTotal: breakdown.diamondTotal,
    gemstonesTotal: breakdown.gemstonesTotal,

    basePrice: baseINR,
    displayPrice,
    convertedMakingCharge: convertedMaking,
    totalConvertedPrice: displayPrice + convertedMaking,
    currency: symbol,
  };
};


    /* ================= VARIANT PRODUCT ================= */

    if (ornament.isVariant) {
      const parent = await Ornament.findById(
        ornament.parentProduct
      ).lean();

      let metalBases = [];

      if (parent?.designCode) {
        const siblings = await Ornament.find({
          designCode: parent.designCode,
          isVariant: false,
        })
          .select("_id metal.metalType")
          .lean();

        metalBases = siblings
          .map((p) => {
            const match =
              p.metal?.metalType?.match(/(\d{2}K)/);
            return match
              ? { id: p._id, purity: match[1] }
              : null;
          })
          .filter(Boolean);
      }

      const converted = convertPrice(ornament);

      return res.json({
        success: true,
        type: "variant",
        ornament: {
          ...converted,
          metalBases,
          currentPurity:
            ornament.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
            null,
        },
      });
    }

    /* ================= MAIN PRODUCT ================= */

    const variants = await Ornament.find({
      parentProduct: ornament._id,
      isVariant: true,
    }).lean();

    const convertedVariants = variants.map((variant) =>
      convertPrice({
        ...variant,
        metal: variant.metal || ornament.metal,
      })
    );

    const convertedMain = convertPrice(ornament);

    return res.json({
      success: true,
      type: "main",
      ornament: {
        ...convertedMain,
        variants: convertedVariants,
        currentPurity:
          ornament.metal?.metalType?.match(/(\d{2}K)/)?.[1] ||
          null,
        startingPrice:
          convertedVariants.length > 0
            ? Math.min(
                ...convertedVariants.map(
                  (v) => v.totalConvertedPrice
                )
              )
            : null,
      },
    });
  } catch (error) {
    console.error("❌ FULL Backend Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ornament",
      error: error.message,
    });
  }
});






// Save/update user details
router.post("/details", protect, saveUserDetails);

// Get logged-in user details
router.get("/details", protect, getUserDetails);

router.post("/forgetpassword", forgetPassword);
router.put("/reset-password/:token", resetPassword);

router.post("/custom", async (req, res) => {
  try {
    const { name, email, phone, inspiration, specialRequests, images } = req.body;

    // Basic validation
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and phone number.",
      });
    }

    // Build email HTML
    const message = `
      <h2>💎 New Custom Jewelry Request</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Inspiration:</b> ${inspiration || "<i>Not provided</i>"}</p>
      <p><b>Special Requests:</b> ${specialRequests || "<i>Not provided</i>"}</p>
      ${
        images?.length
          ? `<p><b>Reference Images:</b> ${images.length} file(s) attached below.</p>`
          : "<p><i>No reference images uploaded.</i></p>"
      }
    `;

    // Send the email (with images attached if available)
    await sendEmail({
      email: "jenasaisubham@gmail.com", // ✅ your admin email
      subject: "New Custom Jewelry Request",
      message,
      attachments:
        images?.map((base64, index) => {
          const base64Data = base64.split(";base64,").pop();
          const mimeType = base64.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

          return {
            filename: `reference-${index + 1}.${mimeType.split("/")[1]}`,
            content: Buffer.from(base64Data, "base64"),
            contentType: mimeType,
          };
        }) || [],
    });

    res.status(200).json({
      success: true,
      message: "Custom request submitted and emailed successfully!",
    });
  } catch (error) {
    console.error("❌ Error sending custom jewelry email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email.",
    });
  }
});

router.post("/inquiry", async (req, res) => {
  try {
    const { fullName, email, phone, location, investment, experience, message } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ success: false, message: "Please fill all required fields." });
    }

    const subject = "New Franchise Inquiry - Nymara Jewels";

    // ✅ Email content for your inbox
    const emailBody = `
      <h2>Franchise Inquiry Details</h2>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Preferred Location:</strong> ${location || "Not specified"}</p>
      <p><strong>Investment Capacity:</strong> ${investment || "Not specified"}</p>
      <p><strong>Business Experience:</strong> ${experience || "Not specified"}</p>
      <p><strong>Message:</strong></p>
      <p>${message || "No additional details provided."}</p>
    `;

    // ✅ Send email to your business inbox
    await sendEmail({
      email: "jenasaisubham8@gmail.com", // 👈 where you receive inquiries
      subject,
      message: emailBody,
    });

    console.log("✅ Franchise inquiry email sent successfully");
    res.status(200).json({ success: true, message: "Inquiry sent successfully" });
  } catch (error) {
    console.error("❌ Error sending franchise inquiry:", error.message);
    res.status(500).json({ success: false, message: "Failed to send inquiry" });
  }
});



export default router;















// controllers/ornamentController.js
import Ornament from "../models/Ornament.js";
import upload from "../cloud/upload.js"; 
import { currencyRates } from "../config/currencyRates.js";
import util from "util";

// Middleware to handle uploads (1 coverImage + multiple images)
export const uploadOrnamentImages = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "images", maxCount: 5 },
  { name: "model3D", maxCount: 1 },
  { name: "videoFile", maxCount: 1 }, 
]);

// ✅ Add Ornament
// ✅ Add Ornament
export const addOrnament = async (req, res) => {
  try {
    console.log("🧩 Incoming Ornament Request:");
    console.log("BODY:\n", JSON.stringify(req.body, null, 2));
    console.log("FILES:\n", util.inspect(req.files, { depth: null, colors: true }));

    // ✅ Extract uploaded files
    const coverImage = req.files?.coverImage?.[0]?.path || null;
    const images = req.files?.images ? req.files.images.map((f) => f.path) : [];
    const model3D = req.files?.model3D?.[0]?.path || req.body.model3D || null;
    let videoUrl = req.files?.videoFile?.[0]?.path || null;

    // ✅ Ensure category & subCategory are strings
    const category = Array.isArray(req.body.category)
      ? req.body.category[0]
      : req.body.category || null;

    const subCategory = Array.isArray(req.body.subCategory)
      ? req.body.subCategory[0]
      : req.body.subCategory || null;

    // ✅ Parse prices safely
    let prices = {};
    if (req.body.prices) {
      try {
        prices =
          typeof req.body.prices === "string"
            ? JSON.parse(req.body.prices)
            : req.body.prices;
      } catch (err) {
        console.warn("⚠️ Invalid prices JSON:", req.body.prices);
      }
    }

    // ✅ Parse makingChargesByCountry safely
    let makingChargesByCountry = {};
    if (req.body.makingChargesByCountry) {
      try {
        makingChargesByCountry =
          typeof req.body.makingChargesByCountry === "string"
            ? JSON.parse(req.body.makingChargesByCountry)
            : req.body.makingChargesByCountry;
      } catch (err) {
        console.warn("⚠️ Invalid makingChargesByCountry JSON:", req.body.makingChargesByCountry);
      }
    }

    // ✅ Parse variantLinks safely
    let variantLinks = {};
    if (req.body.variantLinks) {
      try {
        variantLinks =
          typeof req.body.variantLinks === "string"
            ? JSON.parse(req.body.variantLinks)
            : req.body.variantLinks;

        Object.keys(variantLinks).forEach((key) => {
          if (!variantLinks[key]) delete variantLinks[key];
        });
      } catch (err) {
        console.warn("⚠️ Invalid variantLinks JSON:", req.body.variantLinks);
      }
    }

    // ✅ FIXED: define price before using it
    const price = Number(req.body.price) || 0;
    const originalPrice = Number(req.body.originalPrice) || price;
    let discount = Number(req.body.discount) || 0;

    // ✅ Auto-calculate discount if not provided
    if (!discount && originalPrice > price) {
      discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    const rating = req.body.rating ? Number(req.body.rating) : 0;

    // ✅ Handle diamond details
    let diamondDetails;
    let sideDiamondDetails;

    if (req.body.categoryType === "Diamond") {
      if (req.body.diamondDetails) {
        try {
          diamondDetails =
            typeof req.body.diamondDetails === "string"
              ? JSON.parse(req.body.diamondDetails)
              : req.body.diamondDetails;
        } catch (err) {
          console.warn("⚠️ Invalid diamondDetails JSON:", req.body.diamondDetails);
        }
      }

      if (req.body.sideDiamondDetails) {
        try {
          sideDiamondDetails =
            typeof req.body.sideDiamondDetails === "string"
              ? JSON.parse(req.body.sideDiamondDetails)
              : req.body.sideDiamondDetails;
        } catch (err) {
          console.warn("⚠️ Invalid sideDiamondDetails JSON:", req.body.sideDiamondDetails);
        }
      }

      if (!diamondDetails) {
        return res.status(400).json({
          success: false,
          message: "Diamond products must include 'diamondDetails'.",
        });
      }
    }

    // ✅ Auto-assign type from category if missing
const type = req.body.type || req.body.category || "other";


    // ✅ Prepare final document
    const ornamentData = {
      ...req.body,
       type,
      category,
      subCategory,
      coverImage,
      images,
      prices,
      price, // ✅ ensure base price is saved
      makingChargesByCountry,
      variantLinks: Object.keys(variantLinks).length ? variantLinks : undefined,
      model3D,
      videoUrl,
      originalPrice,
      discount,
      rating,
      diamondDetails,
      sideDiamondDetails,
    };

    // ✅ Create Ornament
    const ornament = await Ornament.create(ornamentData);

    res.status(201).json({
      success: true,
      message: "Ornament added successfully",
      ornament,
    });
  } catch (err) {
    console.error("❌ Add Ornament Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
      error: err.stack || err,
    });
  }
};


// ✅ Get Single Ornament by ID
export const getOrnamentById = async (req, res) => {
  try {
    const curr = (req.query.currency || "INR").toUpperCase();
    const ornament = await Ornament.findById(req.params.id).populate("variantLinks");

    if (!ornament) {
      return res.status(404).json({
        success: false,
        message: "Ornament not found",
      });
    }

    let finalPrice, symbol;

    // ✅ Use manual prices first
    if (ornament.prices && ornament.prices[curr]) {
      const priceObj = ornament.prices[curr];
      finalPrice = priceObj.amount;
      symbol = priceObj.symbol;
    } else if (curr === "INR") {
      finalPrice = ornament.price;
      symbol = "₹";
    } else {
      const selectedCurrency = currencyRates[curr] || currencyRates["INR"];
      finalPrice = (ornament.price || 0) * selectedCurrency.rate;
      symbol = selectedCurrency.symbol;
    }

     let makingCharge = 0;

    if (ornament.makingChargesByCountry && ornament.makingChargesByCountry[curr]) {
      // ✅ If country-specific making charge exists
      makingCharge = ornament.makingChargesByCountry[curr].amount;
    } else if (curr !== "INR" && currencyRates[curr]) {
      // ✅ Convert base makingCharges dynamically
      makingCharge = (ornament.makingCharges || 0) * currencyRates[curr].rate;
    } else {
      // ✅ Fallback to INR
      makingCharge = ornament.makingCharges || 0;
    }

     const diamondInfo =
      ornament.categoryType === "Diamond"
        ? {
            diamondDetails: ornament.diamondDetails || null,
            sideDiamondDetails: ornament.sideDiamondDetails || null,
          }
        : {};

    res.status(200).json({
      success: true,
      ornament: {
        ...ornament.toObject(),
         ...diamondInfo,
        priceInINR: ornament.price,
        displayPrice: Number(finalPrice.toFixed(2)),
        convertedMakingCharge: Number(makingCharge.toFixed(2)),
        currency: symbol,
        prices: ornament.prices || {},
         makingChargesByCountry: ornament.makingChargesByCountry || {},
         model3D: ornament.model3D || null,
         originalPrice: ornament.originalPrice || ornament.price, // ✅ added
        discount:
          ornament.discount ||
          Math.round(
            ((ornament.originalPrice - ornament.price) / ornament.originalPrice) *
              100
          ) ||
          0, 
      
      },
    });
  } catch (err) {
    console.error("❌ Get Ornament Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ornament",
      error: err.message,
    });
  }
};

// ✅ Get All Ornaments (with filters)
export const getOrnaments = async (req, res) => {
  try {
    const {
      gender,
      category,
      subCategory,
      type,
      minPrice,
      maxPrice,
      search,
      sort,
      page = 1,
      limit = 10,
      currency = "INR",
    } = req.query;

    let filter = {};

    if (gender) filter.gender = gender;

    if (category) {
      const categories = Array.isArray(category)
        ? category
        : category.split(",").map((c) => c.trim());
      filter.category = { $in: categories };
    }

    if (subCategory) {
      const subCategories = Array.isArray(subCategory)
        ? subCategory
        : subCategory.split(",").map((s) => s.trim());
      filter.subCategory = { $in: subCategories };
    }

    if (type) filter.type = type;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const ornaments = await Ornament.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate("variantLinks");

    const total = await Ornament.countDocuments(filter);

     

    // ✅ Convert currency
    const ornamentsWithCurrency = ornaments.map((orn) => {
      let finalPrice, symbol;

      if (orn.prices && orn.prices[currency.toUpperCase()]) {
        const priceObj = orn.prices[currency.toUpperCase()];
        finalPrice = priceObj.amount;
        symbol = priceObj.symbol;
      } else {
        const selectedCurrency = currencyRates[currency.toUpperCase()] || currencyRates["INR"];
        finalPrice = (orn.price || 0) * selectedCurrency.rate;
        symbol = selectedCurrency.symbol;
      }

      const originalPrice = orn.originalPrice || orn.price;
      const discount =
        orn.discount ||
        Math.round(((originalPrice - orn.price) / originalPrice) * 100) ||
        0;

      return {
        ...orn.toObject(),
        priceInINR: orn.price,
        displayPrice: Number(finalPrice.toFixed(2)),
        currency: symbol,
          model3D: orn.model3D || null,
        originalPrice,
        discount,
        
      };
    });

    res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      count: ornaments.length,
      ornaments: ornamentsWithCurrency,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ornaments",
      error: err.message,
    });
  }
};

// ✅ Update Ornament
  export const updateOrnament = async (req, res) => {
  try {
    const {
      images,
      addImage,
      removeImage,
      sku,
      prices,
      variantLinks,
      diamondDetails,
      makingChargesByCountry,
      sideDiamondDetails,
      ...updateData
    } = req.body;

    if (sku) {
      return res
        .status(400)
        .json({ message: "SKU cannot be updated manually" });
    }

    const updateOps = { $set: { ...updateData } };

    // ✅ Handle prices
    if (prices) {
      try {
        updateOps.$set.prices =
          typeof prices === "string" ? JSON.parse(prices) : prices;
      } catch (err) {
        console.warn("⚠️ Invalid prices format, skipping:", prices);
      }
    }

    // ✅ Handle makingChargesByCountry
    if (makingChargesByCountry) {
      try {
        updateOps.$set.makingChargesByCountry =
          typeof makingChargesByCountry === "string"
            ? JSON.parse(makingChargesByCountry)
            : makingChargesByCountry;
      } catch (err) {
        console.warn(
          "⚠️ Invalid makingChargesByCountry format, skipping:",
          makingChargesByCountry
        );
      }
    } // ✅ Closed missing brace here

    // ✅ Handle variantLinks
    if (variantLinks) {
      try {
        updateOps.$set.variantLinks =
          typeof variantLinks === "string"
            ? JSON.parse(variantLinks)
            : variantLinks;
      } catch (err) {
        console.warn("⚠️ Invalid variantLinks format, skipping:", variantLinks);
      }
    }

    // ✅ Handle image updates
    if (req.files?.coverImage?.[0]) {
      updateOps.$set.coverImage = req.files.coverImage[0].path;
    }
    if (req.files?.images?.length) {
      updateOps.$set.images = req.files.images.map((file) => file.path);
    }
    if (images) updateOps.$set.images = images;
    if (addImage) updateOps.$push = { images: addImage };
    if (removeImage) updateOps.$pull = { images: removeImage };

    // ✅ Update numeric fields
    if (updateData.price) updateOps.$set.price = Number(updateData.price);
    if (updateData.originalPrice)
      updateOps.$set.originalPrice = Number(updateData.originalPrice);
    if (updateData.discount)
      updateOps.$set.discount = Number(updateData.discount);

    // ✅ Auto-recalculate discount if needed
    const price = updateOps.$set.price;
    const originalPrice = updateOps.$set.originalPrice;
    const discount = updateOps.$set.discount;

    if (!discount && price && originalPrice && originalPrice > price) {
      updateOps.$set.discount = Math.round(
        ((originalPrice - price) / originalPrice) * 100
      );
    }

    // ✅ Handle diamond details
    if (diamondDetails) {
      try {
        updateOps.$set.diamondDetails =
          typeof diamondDetails === "string"
            ? JSON.parse(diamondDetails)
            : diamondDetails;
      } catch (err) {
        console.warn("⚠️ Invalid diamondDetails format:", diamondDetails);
      }
    }

    // 💎 Handle side diamond details (optional)
    if (sideDiamondDetails) {
      try {
        updateOps.$set.sideDiamondDetails =
          typeof sideDiamondDetails === "string"
            ? JSON.parse(sideDiamondDetails)
            : sideDiamondDetails;
      } catch (err) {
        console.warn(
          "⚠️ Invalid sideDiamondDetails format:",
          sideDiamondDetails
        );
      }
    }

    // ✅ Perform DB update
    const ornament = await Ornament.findByIdAndUpdate(
      req.params.id,
      updateOps,
      {
        new: true,
        runValidators: true,
      }
    ).populate("variantLinks");

    if (!ornament) {
      return res.status(404).json({ message: "Ornament not found" });
    }

    res
      .status(200)
      .json({ message: "Ornament updated successfully", ornament });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update ornament",
      error: err.message,
    });
  }
};


// ✅ Delete Ornament
export const deleteOrnament = async (req, res) => {
  try {
    const ornament = await Ornament.findByIdAndDelete(req.params.id);
    if (!ornament) return res.status(404).json({ message: "Ornament not found" });

    res.status(200).json({ message: "Ornament deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete ornament", error: err.message });
  }
};

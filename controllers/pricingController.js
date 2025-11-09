// controllers/pricingController.js
import Pricing from "../models/Pricing.js";
import Ornament from "../models/Ornament.js";

// =======================
// 🟡 UPDATE PRICING
// =======================
export const updatePricing = async (req, res) => {
  try {
    const { goldPrices, diamondPricePerCarat } = req.body;

    // 🧩 Validate input
    if (!goldPrices && !diamondPricePerCarat) {
      return res.status(400).json({ message: "Provide at least one price field" });
    }

    // 🔹 Find existing pricing document or create new
    let pricing = await Pricing.findOne();
    if (!pricing) {
      pricing = new Pricing({
        goldPrices: goldPrices || {},
        diamondPricePerCarat: diamondPricePerCarat || 0,
      });
    } else {
      if (goldPrices) pricing.goldPrices = goldPrices;
      if (diamondPricePerCarat) pricing.diamondPricePerCarat = diamondPricePerCarat;
    }
    await pricing.save();

    // 🔹 Prepare bulk operations array
    const bulkOps = [];

    // 🟡 Recalculate all GOLD ornaments
    if (goldPrices) {
  const goldOrnaments = await Ornament.find({ categoryType: "Gold" });

  goldOrnaments.forEach((item) => {
    // Normalize purity and metal type
    item.purity = item.purity?.toUpperCase();
    item.metalType = item.metalType?.toUpperCase();

    const purityMatch =
      item.purity?.match(/(\d+K)/i) || item.metalType?.match(/(\d+K)/i);
    const karat = purityMatch ? purityMatch[1].toUpperCase() : null;

    const goldRate = karat && goldPrices[karat] ? Number(goldPrices[karat]) : null;

    if (!goldRate) {
      console.warn(`⚠️ No matching gold rate for ${item.name} (${karat || "unknown purity"})`);
      return;
    }

    const newPrice = Number(item.weight) * goldRate;

    bulkOps.push({
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            price: newPrice,
            originalPrice: newPrice,
            "prices.INR.amount": newPrice,
          },
        },
      },
    });
  });
}


    // 💎 Recalculate all DIAMOND ornaments
    if (diamondPricePerCarat) {
      const diamondOrnaments = await Ornament.find({ categoryType: "Diamond" });

      diamondOrnaments.forEach((item) => {
        const newPrice = Number(item.weight) * Number(diamondPricePerCarat);

        bulkOps.push({
          updateOne: {
            filter: { _id: item._id },
            update: {
              $set: {
                price: newPrice,
                originalPrice: newPrice,
                "prices.INR.amount": newPrice,
              },
            },
          },
        });
      });
    }

    if (bulkOps.length > 0) {
      await Ornament.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      message: "Pricing updated successfully and ornaments recalculated by purity",
      pricing,
    });
  } catch (err) {
    console.error("❌ Pricing update error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update pricing",
      error: err.message,
    });
  }
};

// =======================
// 🟢 GET PRICING
// =======================
export const getPricing = async (req, res) => {
  try {
    const pricing = await Pricing.findOne();

    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: "No pricing data found",
      });
    }

    res.status(200).json({
      success: true,
      pricing,
    });
  } catch (err) {
    console.error("❌ getPricing error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing",
      error: err.message,
    });
  }
};

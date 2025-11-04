import mongoose from "mongoose";

const ornamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Product name
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },

    // 🔹 Matches frontend: Gold, Diamond, Gemstone, Fashion
    categoryType: {
      type: String,
      enum: ["Gold", "Diamond", "Gemstone", "Fashion"],
      required: [true, "Category type is required"],
    },

    // 🔹 Matches frontend: rings, earrings, necklaces, bracelets, mens, loose-diamonds
    category: {
      type: String,
      required: true,
      enum: [
        "rings",
        "earrings",
        "necklaces",
        "bracelets",
        "mens",
        "loose-diamonds",
      ],
    },

    // 🔹 Matches frontend: subCategory (lowercase)
    subCategory: {
      type: String,
      enum: [
        "engagement",
        "wedding",
        "eternity",
        "cocktail",
        "gemstone",
        "gold",
        "fashion",
        "studs",
        "hoops",
        "tennis",
        "pendants",
        "bangles",
        "mens rings",
        "mens earrings",
        "mens necklaces",
        "mens bracelets",
        "cufflinks",
      ],
      default: null,
    },

    // 🔹 Matches frontend: type (same values as category)
    type: {
      type: String,
      required: true,
      enum: [
        "rings",
        "earrings",
        "necklaces",
        "bracelets",
        "mens",
        "loose-diamonds",
      ],
    },

    // 🔹 Gender (exact from frontend)
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      required: [true, "Gender is required"],
    },

    sku: { type: String, unique: true },

    // 🔹 Measurements
    weight: { type: Number, required: true },
    purity: { type: String, default: "" },

    // 🔹 Pricing
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    makingCharges: { type: Number, default: 0 },

    // 🔹 Multi-currency support
    prices: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // 🔹 Country-specific making charges
    makingChargesByCountry: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // 🔹 Details
    stoneDetails: { type: String, default: "" },
    description: { type: String, default: "" },
    stock: { type: Number, default: 1 },
    isFeatured: { type: Boolean, default: false },

    // 🔹 Material info
    metalType: {
      type: String,
      enum: [
        "18K White Gold",
        "18K Yellow Gold",
        "18K Rose Gold",
        "Platinum",
        "Sterling Silver",
        "14K Yellow Gold",
        "",
      ],
      default: "",
    },

    stoneType: {
      type: String,
      enum: [
        "Lab-Grown Diamond",
        "Lab-Grown Sapphire",
        "Lab-Grown Emerald",
        "Lab-Grown Ruby",
        "Pearl",
        "None",
        "",
      ],
      default: "",
    },

    style: {
      type: String,
      enum: [
        "Solitaire",
        "Halo",
        "Three Stone",
        "Wedding Band",
        "Eternity",
        "Cocktail",
        "Drop",
        "Vintage",
        "Tennis",
        "Cluster",
        "Chain",
        "Signet",
        "Studs",
        "Bangles",
        "",
      ],
      default: "",
    },

    size: { type: String, default: "" },
    color: { type: String, default: "" },

    // 🔹 Media
    coverImage: { type: String, required: true },
    images: { type: [String], default: [] },
    model3D: { type: String, default: null },
    videoUrl: { type: String, default: null },

    // 🔹 Diamond details
    diamondDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    sideDiamondDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // 🔹 Linked product variants
    variantLinks: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// 🔹 Auto-generate SKU before saving
ornamentSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const catCode = this.categoryType.substring(0, 2).toUpperCase(); // e.g. "GO", "DI"
  const genderCode = this.gender.substring(0, 1).toUpperCase();
  const typeCode = this.category.substring(0, 3).toUpperCase();

  const count = await mongoose.model("Ornament").countDocuments({
    category: this.category,
    gender: this.gender,
  });

  this.sku = `${catCode}-${genderCode}-${typeCode}-${String(count + 1).padStart(
    3,
    "0"
  )}`;

  next();
});

export default mongoose.model("Ornament", ornamentSchema);

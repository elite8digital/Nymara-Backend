import mongoose from "mongoose";

// 🔹 Define embedded variant schema (no separate product IDs)
const variantSchema = new mongoose.Schema(
  {
    color: { type: String, default: "" },
    metalType: { type: String, default: "" },
    size: { type: String, default: "" },
    price: { type: Number, default: 0 },
    coverImage: { type: String, default: null },
    images: { type: [String], default: [] },
     videoUrl: { type: String, default: null },
    isDefault: { type: Boolean, default: false }, // helps frontend identify the main variant
  },
  { _id: false } // prevents auto-creating _id for each variant
);

const ornamentSchema = new mongoose.Schema(
  {
    // 🔸 Basic Details
    name: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },

    // 🔸 Categorization
    categoryType: {
      type: String,
      enum: ["Gold", "Diamond", "Gemstone", "Fashion"],
      required: [true, "Category type is required"],
    },
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
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      required: [true, "Gender is required"],
    },

    // 🔸 Identification
    sku: { type: String, unique: true, index: true },

    // 🔸 Pricing and Attributes
    weight: { type: Number, required: true },
    purity: { type: String, default: "" },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    makingCharges: { type: Number, default: 0 },
    prices: { type: mongoose.Schema.Types.Mixed, default: {} },
    makingChargesByCountry: { type: mongoose.Schema.Types.Mixed, default: {} },

    // 🔸 Stone and Metal Info
    stoneDetails: { type: String, default: "" },
    description: { type: String, default: "" },
    stock: { type: Number, default: 1 },
    isFeatured: { type: Boolean, default: false },
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

    // 🔸 Media
    coverImage: { type: String, required: true },
    images: { type: [String], default: [] },
    model3D: { type: String, default: null },
    videoUrl: { type: String, default: null },

    // 🔸 Diamond / Gemstone Details
    diamondDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    sideDiamondDetails: { type: mongoose.Schema.Types.Mixed, default: null },

    // 🔸 Variant Data (embedded)
    variants: [variantSchema], // ✅ all variants live inside the same product

    // 🔸 Misc
    variantLinks: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// 🔹 Index for faster queries
ornamentSchema.index({ category: 1, gender: 1, isFeatured: 1 });

// 🔹 Auto-generate SKU
ornamentSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const catCode = this.categoryType?.substring(0, 2)?.toUpperCase() || "XX";
  const genderCode = this.gender?.substring(0, 1)?.toUpperCase() || "U";
  const typeCode = this.category?.substring(0, 3)?.toUpperCase() || "GEN";

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

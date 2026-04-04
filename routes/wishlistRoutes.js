import express from "express";
import Wishlist from "../models/Wishlist.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/wishlist — get current user's wishlist (product IDs only)
router.get("/", protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    res.json({ items: wishlist ? wishlist.items : [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
});

// POST /api/wishlist/add — add a product ID
router.post("/add", protect, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: "productId is required" });

  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { $addToSet: { items: productId } },
      { upsert: true, new: true }
    );
    res.json({ items: wishlist.items });
  } catch (err) {
    res.status(500).json({ message: "Failed to add to wishlist" });
  }
});

// DELETE /api/wishlist/remove/:productId — remove a product ID
router.delete("/remove/:productId", protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { items: req.params.productId } },
      { new: true }
    );
    res.json({ items: wishlist ? wishlist.items : [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove from wishlist" });
  }
});

// DELETE /api/wishlist/clear — clear entire wishlist
router.delete("/clear", protect, async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate({ user: req.user.id }, { items: [] });
    res.json({ items: [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear wishlist" });
  }
});

export default router;

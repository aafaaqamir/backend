const express = require("express");
const router = express.Router();

const {
  createSale,
  getSales,
  updateSale,
  deleteSale,
} = require("../controllers/sales.controller");

const { auth, adminOnly } = require("../middleware/auth.middleware");

// Create sale (logged-in users)
router.post("/", auth, createSale);

// Get sales (admin = all, user = own)
router.get("/", auth, getSales);

// Update sale (admin OR owner)
router.put("/:id", auth, updateSale);

// Delete sale (admin only)
router.delete("/:id", auth, adminOnly, deleteSale);

module.exports = router;

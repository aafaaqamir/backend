const express = require("express");
const router = express.Router();
const { login, register, getAllUsers } = require("../controllers/auth.controller");
const { auth, adminOnly } = require("../middleware/auth.middleware");

// Existing routes
router.post("/login", login);
router.post("/register", auth, adminOnly, register);

// ✅ New route: get all users (admin only)
router.get("/users", auth, adminOnly, getAllUsers);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  addPayment,
} = require("../controllers/payment.controller");

const { auth } = require("../middleware/auth.middleware");

router.post("/", auth, addPayment);

module.exports = router;

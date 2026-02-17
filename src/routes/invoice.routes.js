const express = require("express");
const router = express.Router();

const {
  createInvoice,
  getInvoices,
  updateInvoice,
  deleteInvoice,
} = require("../controllers/invoice.controller");

const { auth } = require("../middleware/auth.middleware");

router.post("/", auth, createInvoice);
router.get("/", auth, getInvoices);
router.put("/:id", auth, updateInvoice);
router.delete("/:id", auth, deleteInvoice);

module.exports = router;

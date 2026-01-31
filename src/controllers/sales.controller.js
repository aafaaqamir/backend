const prisma = require("../utils/prisma");

// ---------------- CREATE SALE ----------------
exports.createSale = async (req, res) => {
  try {
    const { date, amount, items, customerName, userId } = req.body;

    if (!date || !amount || !items || !customerName)
      return res.status(400).json({ message: "All fields are required" });

    const sale = await prisma.sale.create({
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
        items: items.trim(),
        customerName: customerName.trim(),
        userId: req.user.role === "ADMIN" && userId ? Number(userId) : req.user.id,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(sale);
  } catch (err) {
    console.error("Create Sale Error:", err);
    res.status(400).json({ message: err.message });
  }
};

// ---------------- GET SALES ----------------
exports.getSales = async (req, res) => {
  try {
    const { startDate, endDate, minAmount, maxAmount, customerName, sortBy, sortOrder } = req.query;

    // Build filters
    const filters = {
      ...(req.user.role !== "ADMIN" && { userId: req.user.id }),
      ...(startDate && endDate && {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
      ...(minAmount && maxAmount && {
        amount: { gte: Number(minAmount), lte: Number(maxAmount) },
      }),
      ...(customerName && {
        customerName: { contains: customerName, mode: "insensitive" },
      }),
    };

    // Build sorting
    const orderBy = {};
    if (sortBy === "date") orderBy.date = sortOrder === "asc" ? "asc" : "desc";
    else if (sortBy === "amount") orderBy.amount = sortOrder === "asc" ? "asc" : "desc";

    const sales = await prisma.sale.findMany({
      where: filters,
      orderBy: orderBy,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(sales);
  } catch (err) {
    console.error("Get Sales Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------- UPDATE SALE ----------------
exports.updateSale = async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });

    if (!sale) return res.status(404).json({ message: "Sale not found" });
    if (req.user.role !== "ADMIN" && sale.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    const updated = await prisma.sale.update({
      where: { id: saleId },
      data: {
        date: req.body.date ? new Date(req.body.date) : sale.date,
        amount: req.body.amount ? parseFloat(req.body.amount) : sale.amount,
        items: req.body.items || sale.items,
        customerName: req.body.customerName || sale.customerName,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(updated);
  } catch (err) {
    console.error("Update Sale Error:", err);
    res.status(400).json({ message: err.message });
  }
};

// ---------------- DELETE SALE ----------------
exports.deleteSale = async (req, res) => {
  try {
    const saleId = Number(req.params.id);

    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // Only ADMIN can delete
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ message: "Access denied" });

    await prisma.sale.delete({ where: { id: saleId } });
    res.json({ message: "Sale deleted" });
  } catch (err) {
    console.error("Delete Sale Error:", err);
    res.status(400).json({ message: err.message });
  }
};

const prisma = require("../utils/prisma");

// ======================
// CREATE EXPENSE
// ======================
exports.createExpense = async (req, res) => {
  try {
    const { title, amount, date } = req.body;

    if (!title || !amount || !date) {
      return res.status(400).json({
        msg: "Title, amount and date are required",
      });
    }

    const expense = await prisma.expense.create({
      data: {
        title: String(title),
        amount: Number(amount),          // 🔥 Convert to number
        date: new Date(date),            // 🔥 Convert to Date object
        userId: req.user.id,
      },
    });

    res.json(expense);
  } catch (err) {
    console.error("Create Expense Error:", err);
    res.status(500).json({
      msg: "Failed to create expense",
    });
  }
};

// ======================
// GET EXPENSES
// ======================
// controllers/expense.controller.js

exports.getExpenses = async (req, res) => {
  try {
    let where = {};

    // If NOT admin → only own expenses
    if (req.user.role !== "ADMIN") {
      where.userId = req.user.id;
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    res.json(expenses);
  } catch (err) {
    console.error("Get Expenses Error:", err);

    res.status(500).json({
      msg: "Failed to fetch expenses",
    });
  }
};



// ======================
// UPDATE EXPENSE
// ======================
exports.updateExpense = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense)
      return res.status(404).json({
        msg: "Expense not found",
      });

    if (
      req.user.role !== "ADMIN" &&
      expense.userId !== req.user.id
    ) {
      return res.status(403).json({
        msg: "Forbidden",
      });
    }

    const { title, amount, date } = req.body;

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        title: title ? String(title) : expense.title,
        amount: amount
          ? Number(amount)
          : expense.amount,
        date: date
          ? new Date(date)
          : expense.date,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Update Expense Error:", err);
    res.status(500).json({
      msg: "Failed to update expense",
    });
  }
};

// ======================
// DELETE EXPENSE
// ======================
exports.deleteExpense = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        msg: "Admin only",
      });
    }

    const id = Number(req.params.id);

    await prisma.expense.delete({
      where: { id },
    });

    res.json({ msg: "Expense deleted" });
  } catch (err) {
    console.error("Delete Expense Error:", err);
    res.status(500).json({
      msg: "Failed to delete expense",
    });
  }
};

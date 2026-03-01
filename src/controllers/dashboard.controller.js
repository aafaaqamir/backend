const prisma = require("../utils/prisma");

exports.getDashboard = async (req, res) => {
  try {
    // 🔹 No role-based filtering — everyone sees full data
    const sales = await prisma.invoice.aggregate({
      _sum: { agreement: true },
    });

    const expenses = await prisma.expense.aggregate({
      _sum: { amount: true },
    });

    const monthlySales = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") AS month,
        SUM("agreement") AS total
      FROM "Invoice"
      GROUP BY month
      ORDER BY month
    `;

    const userComparison = await prisma.$queryRaw`
      SELECT 
        u.name,
        SUM(i."agreement") AS total
      FROM "User" u
      JOIN "Invoice" i
        ON u.id = i."userId"
      GROUP BY u.name
    `;

    res.status(200).json({
      totalSales: sales._sum.agreement || 0,
      totalExpenses: expenses._sum.amount || 0,
      netProfit:
        (sales._sum.agreement || 0) -
        (expenses._sum.amount || 0),
      monthlySales,
      userComparison,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: err.message,
    });
  }
};
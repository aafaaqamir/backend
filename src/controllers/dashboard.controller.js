const prisma = require("../utils/prisma");

exports.getDashboard = async (req, res) => {
  try {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : { userId: req.user.id };

    const sales = await prisma.invoice.aggregate({
      where,
      _sum: { agreement: true },
    });

    const expenses = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    const monthlySales =
      req.user.role === "ADMIN"
        ? await prisma.$queryRaw`
          SELECT DATE_TRUNC('month',"createdAt") AS month,
          SUM("agreement") AS total
          FROM "Invoice"
          GROUP BY month
          ORDER BY month
        `
        : [];

    const userComparison =
      req.user.role === "ADMIN"
        ? await prisma.$queryRaw`
          SELECT u.name,
          SUM(i."agreement") AS total
          FROM "User" u
          JOIN "Invoice" i
          ON u.id = i."userId"
          GROUP BY u.name
        `
        : [];

    res.json({
      totalSales: sales._sum.agreement || 0,
      totalExpenses: expenses._sum.amount || 0,
      netProfit:
        (sales._sum.agreement || 0) -
        (expenses._sum.amount || 0),
      monthlySales,
      userComparison,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

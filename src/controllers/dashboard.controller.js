const prisma = require("../utils/prisma");

exports.getDashboardStats = async (req, res) => {
  try {
    const { fromDate, toDate, userId } = req.query;

    /* ================= DATE FILTER ================= */
    const dateFilter = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    /* ================= ROLE-BASED FILTER ================= */
    const baseFilter = {
      ...(req.user.role !== "ADMIN" && { userId: req.user.id }),
      ...(req.user.role === "ADMIN" &&
        userId &&
        userId !== "ALL" && { userId: Number(userId) }),
      ...(Object.keys(dateFilter).length && { date: dateFilter }),
    };

    /* ================= TOTAL SALES ================= */
    const totalSalesCount = await prisma.sale.count({
      where: baseFilter,
    });

    const totalSalesAmountRaw = await prisma.sale.aggregate({
      where: baseFilter,
      _sum: { amount: true },
    });

    const totalSalesAmount = Number(
      totalSalesAmountRaw._sum.amount || 0
    );

    /* ================= TODAY SALES ================= */
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySalesRaw = await prisma.sale.aggregate({
      where: {
        ...baseFilter,
        date: { gte: todayStart },
      },
      _sum: { amount: true },
    });

    const todaySalesAmount = Number(
      todaySalesRaw._sum.amount || 0
    );

    /* ================= MONTHLY SALES ================= */
    const salesRaw = await prisma.sale.findMany({
      where: baseFilter,
      select: { amount: true, date: true },
    });

    const monthlyMap = {};
    salesRaw.forEach((sale) => {
      const month = sale.date.toLocaleString("default", {
        month: "short",
      });
      monthlyMap[month] = (monthlyMap[month] || 0) + Number(sale.amount);
    });

    const monthlySales = Object.entries(monthlyMap).map(
      ([month, amount]) => ({
        month,
        amount,
      })
    );

    /* ================= ADMIN: SALES BY USER ================= */
    let salesByUser = [];

    if (req.user.role === "ADMIN") {
      const users = await prisma.user.findMany({
        select: { id: true, name: true },
      });

      salesByUser = await Promise.all(
        users.map(async (u) => {
          const userSales = await prisma.sale.findMany({
            where: {
              userId: u.id,
              ...(Object.keys(dateFilter).length && { date: dateFilter }),
            },
            select: { amount: true, date: true },
          });

          const userMonthlyMap = {};
          userSales.forEach((s) => {
            const m = s.date.toLocaleString("default", {
              month: "short",
            });
            userMonthlyMap[m] =
              (userMonthlyMap[m] || 0) + Number(s.amount);
          });

          return {
            userId: u.id,
            userName: u.name,
            totalSales: userSales.length,
            totalAmount: userSales.reduce(
              (sum, s) => sum + Number(s.amount),
              0
            ),
            monthlySales: Object.entries(userMonthlyMap).map(
              ([month, amount]) => ({ month, amount })
            ),
          };
        })
      );
    }

    /* ================= RESPONSE ================= */
    res.json({
      totalSalesCount,
      totalSalesAmount,
      todaySalesAmount,
      monthlySales,
      salesByUser,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: err.message });
  }
};

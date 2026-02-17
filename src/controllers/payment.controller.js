const prisma = require("../utils/prisma");

exports.addPayment = async (req, res) => {
  try {
    const { invoiceId, amount, type } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(invoiceId) },
    });

    if (!invoice)
      return res.status(404).json({ msg: "Invoice not found" });

    if (
      req.user.role !== "ADMIN" &&
      invoice.userId !== req.user.id
    ) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    await prisma.payment.create({
      data: {
        userId: req.user.id,
        invoiceId: Number(invoiceId),
        amount,
        type,
      },
    });

    const newPaid =
      Number(invoice.paidAmount) +
      Number(amount);

    let status = "UNPAID";

    if (newPaid >= invoice.agreement)
      status = "PAID";
    else if (newPaid > 0)
      status = "PARTIAL";

    await prisma.invoice.update({
      where: { id: Number(invoiceId) },
      data: {
        paidAmount: newPaid,
        status,
      },
    });

    res.json({ msg: "Payment added" });
  } catch (err) {
    res.status(500).json(err);
  }
};

const prisma = require("../utils/prisma");

// ==============================
// CREATE INVOICE
// ==============================
exports.createInvoice = async (req, res) => {
  try {
    const {
      date,
      customerName,
      contact,
      size,
      agreement,
      advancePayment,
    } = req.body;

    if (!date || !customerName || !size || !agreement) {
      return res.status(400).json({
        msg: "Required fields missing",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Find or create customer
        let customer = await tx.customer.findFirst({
          where: { name: customerName },
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: String(customerName),
              phone: contact || null,
            },
          });
        }

        const agreementAmount = Number(agreement);
        const advance = Number(advancePayment || 0);

        // Create invoice
        const invoice = await tx.invoice.create({
          data: {
            userId: req.user.id,
            customerId: customer.id,
            date: new Date(date),
            size: String(size),
            agreement: agreementAmount,
            paidAmount: advance,
            status:
              advance >= agreementAmount
                ? "PAID"
                : advance > 0
                ? "PARTIAL"
                : "UNPAID",
          },
        });

        // If advance exists create payment record
        if (advance > 0) {
          await tx.payment.create({
            data: {
              userId: req.user.id,
              invoiceId: invoice.id,
              amount: advance,
              type: "ADVANCE",
            },
          });
        }

        return invoice;
      }
    );

    res.json(result);
  } catch (err) {
    console.error("Create Invoice Error:", err);
    res.status(500).json({
      msg: "Failed to create invoice",
    });
  }
};

// ==============================
// GET INVOICES
// ==============================
exports.getInvoices = async (req, res) => {
  try {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : { userId: req.user.id };

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        payments: true,
      },
      orderBy: { date: "desc" },
    });

    res.json(invoices);
  } catch (err) {
    console.error("Get Invoice Error:", err);
    res.status(500).json({
      msg: "Failed to fetch invoices",
    });
  }
};

// UPDATE INVOICE (FULL)
// ==============================
exports.updateInvoice = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      date,
      customerName,
      contact,
      size,
      agreement,
      advance,
    } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        msg: "Invoice not found",
      });
    }

    // Authorization
    if (
      req.user.role !== "ADMIN" &&
      invoice.userId !== req.user.id
    ) {
      return res.status(403).json({
        msg: "Forbidden",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        /* ======================
           UPDATE CUSTOMER
        ====================== */

        let customerId = invoice.customerId;

        if (customerName || contact) {
          const updatedCustomer =
            await tx.customer.update({
              where: {
                id: invoice.customerId,
              },
              data: {
                name: customerName
                  ? String(customerName)
                  : invoice.customer.name,

                phone: contact
                  ? String(contact)
                  : invoice.customer.phone,
              },
            });

          customerId = updatedCustomer.id;
        }

        /* ======================
           UPDATE INVOICE
        ====================== */

        const agreementAmount = agreement
          ? Number(agreement)
          : invoice.agreement;

        const paidAmount = advance !== undefined
          ? Number(advance)
          : invoice.paidAmount;

        // Calculate status
        let status = "UNPAID";

        if (paidAmount >= agreementAmount) {
          status = "PAID";
        } else if (paidAmount > 0) {
          status = "PARTIAL";
        }

        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            customerId,

            date: date
              ? new Date(date)
              : invoice.date,

            size: size
              ? String(size)
              : invoice.size,

            agreement: agreementAmount,

            paidAmount,

            status,
          },
        });

        /* ======================
           UPDATE PAYMENT (ADVANCE)
        ====================== */

        if (advance !== undefined) {
          // Remove old advance payments
          await tx.payment.deleteMany({
            where: {
              invoiceId: id,
              type: "ADVANCE",
            },
          });

          // Insert new advance payment
          if (paidAmount > 0) {
            await tx.payment.create({
              data: {
                userId: req.user.id,
                invoiceId: id,
                amount: paidAmount,
                type: "ADVANCE",
              },
            });
          }
        }

        return updatedInvoice;
      }
    );

    res.json(result);

  } catch (err) {
    console.error("Update Invoice Error:", err);

    res.status(500).json({
      msg: "Failed to update invoice",
    });
  }
};

// ==============================
// DELETE INVOICE (ADMIN ONLY)
// ==============================
exports.deleteInvoice = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        msg: "Admin only",
      });
    }

    const id = Number(req.params.id);

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: { invoiceId: id },
      });

      await tx.invoice.delete({
        where: { id },
      });
    });

    res.json({ msg: "Invoice deleted" });
  } catch (err) {
    console.error("Delete Invoice Error:", err);
    res.status(500).json({
      msg: "Failed to delete invoice",
    });
  }
};

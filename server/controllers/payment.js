const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "PAID") {
  return res.status(400).json({
    message: "Order already paid",
  });
}

   const validMethods = ["COD", "CARD", "BANK_TRANSFER"];

if (method && !validMethods.includes(method)) {
  return res.status(400).json({
    message: "Invalid payment method",
  });
}
    const paymentMethod = method || order.paymentMethod;

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: paymentMethod,
        status: "PENDING",
        amount: order.total,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: paymentMethod,
        paymentStatus: "PENDING",
      },
    });

    return res.status(201).json(payment);
  } catch (error) {
    console.error("createPayment error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const processPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { result } = req.body;

    const validResults = ["PAID", "FAILED"];

    if (!validResults.includes(result)) {
      return res.status(400).json({
        message: "Invalid payment result",
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (payment.status === "PAID") {
      return res.status(400).json({
        message: "Payment already completed",
      });
    }

    if (result === "PAID") {
      const updatedPayment = await prisma.$transaction(async (tx) => {
        for (const item of payment.order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.title}`);
          }
        }

        for (const item of payment.order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING",
          },
        });

        const newPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            transactionId: `TXN-${Date.now()}`,
          },
        });

        return newPayment;
      });

      return res.json({
        message: "Payment successful",
        payment: updatedPayment,
      });
    }

    const failedPayment = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "FAILED",
        },
      });

      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
        },
      });

      return updated;
    });

    return res.json({
      message: "Payment failed",
      payment: failedPayment,
    });
  } catch (error) {
    console.error("processPayment error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    return res.json(payment);
  } catch (error) {
    console.error("getPaymentByOrderId error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(payments);
  } catch (error) {
    console.error("getAllPayments error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createPayment,
  processPayment,
  getPaymentByOrderId,
  getAllPayments,
};
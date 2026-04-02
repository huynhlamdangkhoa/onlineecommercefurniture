const {
  PrismaClient,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  DeliveryMethod,
} = require("@prisma/client");

const prisma = new PrismaClient();
const { createOrderUpdateNotification } = require("../utills/notificationHelpers");

function toDecimalString(value, fallback = "0") {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return String(num);
}

function normalizeEnum(value, enumObject, fallback) {
  if (!value) return fallback;
  return Object.values(enumObject).includes(value) ? value : fallback;
}

function buildOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `UF-${y}${m}${d}-${h}${min}${s}`;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && item.productId)
    .map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
      productTitle: item.productTitle || item.title || "",
      unitPrice: toDecimalString(item.unitPrice || item.price, "0"),
      subtotal: toDecimalString(item.subtotal, "0"),
      conditionAtOrder: item.conditionAtOrder || null,
    }));
}

function buildShippingFields(body) {
  return {
    shippingRecipientName:
      body.shippingRecipientName ||
      body.recipientName ||
      [body.name, body.lastname].filter(Boolean).join(" ").trim() ||
      null,
    shippingPhone: body.shippingPhone || body.phone || null,
    shippingLine1: body.shippingLine1 || body.adress || body.address || null,
    shippingWard: body.shippingWard || body.ward || null,
    shippingDistrict: body.shippingDistrict || body.district || null,
    shippingCity: body.shippingCity || body.city || null,
    shippingProvince: body.shippingProvince || body.province || null,
    shippingCountry: body.shippingCountry || body.country || "Vietnam",
  };
}

async function createCustomerOrder(request, response) {
  try {
    const body = request.body || {};
    const items = normalizeItems(body.items);

    if (!body.userId) {
      return response.status(400).json({
        error: "Validation failed",
        details: "userId is required",
      });
    }

    if (!body.shippingAddressId) {
      return response.status(400).json({
        error: "Validation failed",
        details: "shippingAddressId is required",
      });
    }

    if (items.length === 0) {
      return response.status(400).json({
        error: "Validation failed",
        details: "At least one order item is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      return response.status(404).json({
        error: "User not found",
        details: "The specified user does not exist",
      });
    }

    const shippingAddress = await prisma.address.findUnique({
      where: { id: body.shippingAddressId },
    });

    if (!shippingAddress) {
      return response.status(404).json({
        error: "Address not found",
        details: "The specified shipping address does not exist",
      });
    }

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return response.status(404).json({
          error: "Product not found",
          details: `Product ${item.productId} does not exist`,
        });
      }

      if (product.stock < item.quantity) {
        return response.status(400).json({
          error: "Insufficient stock",
          details: `Product ${product.title} does not have enough stock`,
        });
      }

      if (!item.productTitle) {
        item.productTitle = product.title;
      }

      if (item.unitPrice === "0") {
        item.unitPrice = String(product.price);
      }

      if (item.subtotal === "0") {
        item.subtotal = String(Number(item.unitPrice) * item.quantity);
      }
    }

    const shippingFields = buildShippingFields(body);

    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: body.orderNumber || buildOrderNumber(),
          userId: body.userId,
          shippingAddressId: body.shippingAddressId,
          status: normalizeEnum(body.status, OrderStatus, OrderStatus.PENDING),
          paymentMethod: normalizeEnum(
            body.paymentMethod,
            PaymentMethod,
            PaymentMethod.COD
          ),
          deliveryMethod: normalizeEnum(
            body.deliveryMethod,
            DeliveryMethod,
            DeliveryMethod.DELIVERY
          ),
          paymentStatus: normalizeEnum(
            body.paymentStatus,
            PaymentStatus,
            PaymentStatus.PENDING
          ),
          subtotal: toDecimalString(body.subtotal, "0"),
          shippingFee: toDecimalString(body.shippingFee, "0"),
          discount: toDecimalString(body.discount, "0"),
          total: toDecimalString(body.total, "0"),
          note: body.note || body.orderNotice || null,
          ...shippingFields,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productTitle: item.productTitle,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
              conditionAtOrder: item.conditionAtOrder,
            })),
          },
          payment: body.payment
            ? {
                create: {
                  method: normalizeEnum(
                    body.payment.method || body.paymentMethod,
                    PaymentMethod,
                    PaymentMethod.COD
                  ),
                  status: normalizeEnum(
                    body.payment.status || body.paymentStatus,
                    PaymentStatus,
                    PaymentStatus.PENDING
                  ),
                  transactionId: body.payment.transactionId || null,
                  amount: toDecimalString(
                    body.payment.amount || body.total,
                    "0"
                  ),
                  paidAt: body.payment.paidAt ? new Date(body.payment.paidAt) : null,
                },
              }
            : undefined,
        },
        include: {
          items: true,
          payment: true,
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });

    try {
      await createOrderUpdateNotification(
        body.userId,
        createdOrder.status,
        createdOrder.id,
        createdOrder.total
      );
    } catch (notificationError) {
      console.error("Failed to create order notification:", notificationError);
    }

    return response.status(201).json({
      id: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to create order",
    });
  }
}

async function updateCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    const body = request.body || {};

    if (!id) {
      return response.status(400).json({
        error: "Invalid order ID",
        details: "Order ID must be provided",
      });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!existingOrder) {
      return response.status(404).json({
        error: "Order not found",
        details: "The specified order does not exist",
      });
    }

    const shippingFields = buildShippingFields(body);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          status:
            body.status !== undefined
              ? normalizeEnum(body.status, OrderStatus, existingOrder.status)
              : existingOrder.status,
          paymentMethod:
            body.paymentMethod !== undefined
              ? normalizeEnum(
                  body.paymentMethod,
                  PaymentMethod,
                  existingOrder.paymentMethod
                )
              : existingOrder.paymentMethod,
          deliveryMethod:
            body.deliveryMethod !== undefined
              ? normalizeEnum(
                  body.deliveryMethod,
                  DeliveryMethod,
                  existingOrder.deliveryMethod
                )
              : existingOrder.deliveryMethod,
          paymentStatus:
            body.paymentStatus !== undefined
              ? normalizeEnum(
                  body.paymentStatus,
                  PaymentStatus,
                  existingOrder.paymentStatus
                )
              : existingOrder.paymentStatus,
          subtotal:
            body.subtotal !== undefined
              ? toDecimalString(body.subtotal, "0")
              : existingOrder.subtotal,
          shippingFee:
            body.shippingFee !== undefined
              ? toDecimalString(body.shippingFee, "0")
              : existingOrder.shippingFee,
          discount:
            body.discount !== undefined
              ? toDecimalString(body.discount, "0")
              : existingOrder.discount,
          total:
            body.total !== undefined
              ? toDecimalString(body.total, "0")
              : existingOrder.total,
          note:
            body.note !== undefined
              ? body.note
              : body.orderNotice !== undefined
              ? body.orderNotice
              : existingOrder.note,
          shippingRecipientName:
            shippingFields.shippingRecipientName ?? existingOrder.shippingRecipientName,
          shippingPhone: shippingFields.shippingPhone ?? existingOrder.shippingPhone,
          shippingLine1: shippingFields.shippingLine1 ?? existingOrder.shippingLine1,
          shippingWard: shippingFields.shippingWard ?? existingOrder.shippingWard,
          shippingDistrict:
            shippingFields.shippingDistrict ?? existingOrder.shippingDistrict,
          shippingCity: shippingFields.shippingCity ?? existingOrder.shippingCity,
          shippingProvince:
            shippingFields.shippingProvince ?? existingOrder.shippingProvince,
          shippingCountry:
            shippingFields.shippingCountry ?? existingOrder.shippingCountry,
        },
        include: {
          items: true,
          payment: true,
        },
      });

      if (body.payment && order.payment) {
        await tx.payment.update({
          where: { orderId: id },
          data: {
            method: normalizeEnum(
              body.payment.method,
              PaymentMethod,
              order.payment.method
            ),
            status: normalizeEnum(
              body.payment.status,
              PaymentStatus,
              order.payment.status
            ),
            transactionId:
              body.payment.transactionId !== undefined
                ? body.payment.transactionId
                : order.payment.transactionId,
            amount:
              body.payment.amount !== undefined
                ? toDecimalString(body.payment.amount, "0")
                : order.payment.amount,
            paidAt:
              body.payment.paidAt !== undefined
                ? body.payment.paidAt
                  ? new Date(body.payment.paidAt)
                  : null
                : order.payment.paidAt,
          },
        });
      }

      return order;
    });

    if (existingOrder.status !== updatedOrder.status) {
      try {
        await createOrderUpdateNotification(
          updatedOrder.userId,
          updatedOrder.status,
          updatedOrder.id,
          updatedOrder.total
        );
      } catch (notificationError) {
        console.error("Failed to create status update notification:", notificationError);
      }
    }

    return response.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to update order",
    });
  }
}

async function deleteCustomerOrder(request, response) {
  try {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({
        error: "Invalid order ID",
        details: "Order ID must be provided",
      });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!existingOrder) {
      return response.status(404).json({
        error: "Order not found",
        details: "The specified order does not exist",
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of existingOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      await tx.payment.deleteMany({
        where: { orderId: id },
      });

      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      await tx.order.delete({
        where: { id },
      });
    });

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting order:", error);
    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to delete order",
    });
  }
}

async function getCustomerOrder(request, response) {
  try {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({
        error: "Invalid order ID",
        details: "Order ID must be provided",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        shippingAddress: true,
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return response.status(404).json({
        error: "Order not found",
        details: "The specified order does not exist",
      });
    }

    return response.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to fetch order",
    });
  }
}

async function getAllOrders(request, response) {
  try {
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = {};

    if (request.query.userId) {
      where.userId = request.query.userId;
    }

    if (request.query.status) {
      where.status = request.query.status;
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          items: true,
          payment: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.order.count({ where }),
    ]);

    return response.json({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to fetch orders",
    });
  }
}

module.exports = {
  createCustomerOrder,
  updateCustomerOrder,
  deleteCustomerOrder,
  getCustomerOrder,
  getAllOrders,
};
const { PrismaClient, ProductCondition } = require("@prisma/client");
const prisma = new PrismaClient();
const { asyncHandler, AppError } = require("../utills/errorHandler");

function toDecimalString(value, fallback = "0") {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return String(num);
}

function toPositiveInt(value, fallback = 1) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return fallback;
  return num;
}

function normalizeCondition(value, fallback = null) {
  if (!value) return fallback;
  return Object.values(ProductCondition).includes(value) ? value : fallback;
}

async function recalculateOrderTotals(tx, orderId) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  const subtotalNumber = order.items.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  const shippingFeeNumber = Number(order.shippingFee || 0);
  const discountNumber = Number(order.discount || 0);
  const totalNumber = subtotalNumber + shippingFeeNumber - discountNumber;

  await tx.order.update({
    where: { id: orderId },
    data: {
      subtotal: String(subtotalNumber),
      total: String(totalNumber < 0 ? 0 : totalNumber),
    },
  });
}

const createOrderProduct = asyncHandler(async (request, response) => {
  const body = request.body || {};
  const orderId = body.orderId || body.customerOrderId;
  const productId = body.productId;
  const quantity = toPositiveInt(body.quantity, 0);

  if (!orderId) {
    throw new AppError("Order ID is required", 400);
  }

  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  if (!quantity) {
    throw new AppError("Valid quantity is required", 400);
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    throw new AppError("Order not found", 404);
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  if (existingProduct.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  const unitPrice = toDecimalString(body.unitPrice, String(existingProduct.price));
  const subtotal = toDecimalString(
    body.subtotal,
    String(Number(unitPrice) * quantity)
  );

  const orderProduct = await prisma.$transaction(async (tx) => {
    const createdItem = await tx.orderItem.create({
      data: {
        orderId,
        productId,
        productTitle: body.productTitle || existingProduct.title,
        unitPrice,
        quantity,
        subtotal,
        conditionAtOrder: normalizeCondition(
          body.conditionAtOrder,
          existingProduct.condition || null
        ),
      },
      include: {
        product: true,
        order: true,
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    await recalculateOrderTotals(tx, orderId);

    return createdItem;
  });

  return response.status(201).json(orderProduct);
});

const updateProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const body = request.body || {};

  if (!id) {
    throw new AppError("Order item ID is required", 400);
  }

  const existingItem = await prisma.orderItem.findUnique({
    where: { id },
  });

  if (!existingItem) {
    throw new AppError("Order item not found", 404);
  }

  const nextOrderId = body.orderId || body.customerOrderId || existingItem.orderId;
  const nextProductId = body.productId || existingItem.productId;
  const nextQuantity =
    body.quantity !== undefined
      ? toPositiveInt(body.quantity, 0)
      : existingItem.quantity;

  if (!nextQuantity) {
    throw new AppError("Quantity must be greater than 0", 400);
  }

  const targetOrder = await prisma.order.findUnique({
    where: { id: nextOrderId },
  });

  if (!targetOrder) {
    throw new AppError("Order not found", 404);
  }

  const targetProduct = await prisma.product.findUnique({
    where: { id: nextProductId },
  });

  if (!targetProduct) {
    throw new AppError("Product not found", 404);
  }

  if (nextProductId === existingItem.productId) {
    const availableStock = targetProduct.stock + existingItem.quantity;
    if (availableStock < nextQuantity) {
      throw new AppError("Insufficient stock", 400);
    }
  } else {
    if (targetProduct.stock < nextQuantity) {
      throw new AppError("Insufficient stock", 400);
    }
  }

  const unitPrice = toDecimalString(body.unitPrice, String(targetProduct.price));
  const subtotal = toDecimalString(
    body.subtotal,
    String(Number(unitPrice) * nextQuantity)
  );

  const updatedOrderItem = await prisma.$transaction(async (tx) => {
    if (nextProductId === existingItem.productId) {
      await tx.product.update({
        where: { id: existingItem.productId },
        data: {
          stock: {
            increment: existingItem.quantity - nextQuantity,
          },
        },
      });
    } else {
      await tx.product.update({
        where: { id: existingItem.productId },
        data: {
          stock: {
            increment: existingItem.quantity,
          },
        },
      });

      await tx.product.update({
        where: { id: nextProductId },
        data: {
          stock: {
            decrement: nextQuantity,
          },
        },
      });
    }

    const updatedItem = await tx.orderItem.update({
      where: { id: existingItem.id },
      data: {
        orderId: nextOrderId,
        productId: nextProductId,
        productTitle: body.productTitle || targetProduct.title,
        unitPrice,
        quantity: nextQuantity,
        subtotal,
        conditionAtOrder: normalizeCondition(
          body.conditionAtOrder,
          targetProduct.condition || existingItem.conditionAtOrder || null
        ),
      },
      include: {
        product: true,
        order: true,
      },
    });

    await recalculateOrderTotals(tx, existingItem.orderId);

    if (nextOrderId !== existingItem.orderId) {
      await recalculateOrderTotals(tx, nextOrderId);
    }

    return updatedItem;
  });

  return response.json(updatedOrderItem);
});

const deleteProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Order item ID is required", 400);
  }

  const existingItem = await prisma.orderItem.findUnique({
    where: { id },
  });

  if (!existingItem) {
    throw new AppError("Order item not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: existingItem.productId },
      data: {
        stock: {
          increment: existingItem.quantity,
        },
      },
    });

    await tx.orderItem.delete({
      where: { id },
    });

    await recalculateOrderTotals(tx, existingItem.orderId);
  });

  return response.status(204).send();
});

const getProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Order ID is required", 400);
  }

  const items = await prisma.orderItem.findMany({
    where: {
      orderId: id,
    },
    include: {
      product: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          subtotal: true,
          shippingFee: true,
          discount: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!items || items.length === 0) {
    throw new AppError("Order items not found", 404);
  }

  return response.status(200).json(items);
});

const getAllProductOrders = asyncHandler(async (request, response) => {
  const orderItems = await prisma.orderItem.findMany({
    include: {
      order: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          payment: true,
        },
      },
      product: {
        select: {
          id: true,
          title: true,
          mainImage: true,
          price: true,
          slug: true,
          status: true,
          stock: true,
        },
      },
    },
  });

  const ordersMap = new Map();

  for (const item of orderItems) {
    const order = item.order;

    if (!ordersMap.has(order.id)) {
      ordersMap.set(order.id, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        discount: order.discount,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: order.user,
        payment: order.payment,
        products: [],
      });
    }

    ordersMap.get(order.id).products.push({
      id: item.id,
      productId: item.productId,
      productTitle: item.productTitle,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      conditionAtOrder: item.conditionAtOrder,
      product: item.product,
    });
  }

  return response.json(Array.from(ordersMap.values()));
});

module.exports = {
  createOrderProduct,
  updateProductOrder,
  deleteProductOrder,
  getProductOrder,
  getAllProductOrders,
};
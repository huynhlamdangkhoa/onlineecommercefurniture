const prisma = require("../utills/db");
const { asyncHandler, AppError } = require("../utills/errorHandler");
const { ProductCondition, ProductStatus, UserRole } = require("@prisma/client");

const ALLOWED_SORT_VALUES = [
  "defaultSort",
  "titleAsc",
  "titleDesc",
  "lowPrice",
  "highPrice",
  "newest",
  "oldest",
];

function normalizeSortValue(sortValue) {
  return ALLOWED_SORT_VALUES.includes(sortValue) ? sortValue : "defaultSort";
}

function buildOrderBy(sortValue) {
  switch (normalizeSortValue(sortValue)) {
    case "titleAsc":
      return { title: "asc" };
    case "titleDesc":
      return { title: "desc" };
    case "lowPrice":
      return { price: "asc" };
    case "highPrice":
      return { price: "desc" };
    case "newest":
      return { createdAt: "desc" };
    case "oldest":
      return { createdAt: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

function parsePositiveInt(value, fallback) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : fallback;
}

function parseDecimal(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : String(num);
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return fallback;
}

function normalizeStock(stock, inStock) {
  if (stock !== undefined && stock !== null && stock !== "") {
    const parsed = Number(stock);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (inStock !== undefined) {
    return normalizeBoolean(inStock) ? 1 : 0;
  }

  return 1;
}

function normalizeCondition(condition, fallback = ProductCondition.GOOD) {
  return Object.values(ProductCondition).includes(condition) ? condition : fallback;
}

function normalizeStatus(status, fallback = ProductStatus.AVAILABLE) {
  return Object.values(ProductStatus).includes(status) ? status : fallback;
}

function buildWhereClause(query) {
  const {
    search,
    category,
    city,
    province,
    condition,
    status,
    sellerId,
    minPrice,
    maxPrice,
    inStock,
    outOfStock,
  } = query;

  const where = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { brand: { contains: search } },
      { material: { contains: search } },
      { roomType: { contains: search } },
      { city: { contains: search } },
      { province: { contains: search } },
    ];
  }

  if (category) {
    where.category = {
      OR: [
        { id: category },
        { name: category },
        { slug: category },
      ],
    };
  }

  if (city) {
    where.city = { contains: city };
  }

  if (province) {
    where.province = { contains: province };
  }

  if (condition && Object.values(ProductCondition).includes(condition)) {
    where.condition = condition;
  }

  if (status && Object.values(ProductStatus).includes(status)) {
    where.status = status;
  }

  if (sellerId) {
    where.sellerId = sellerId;
  }

  const priceFilter = {};
  const min = parseDecimal(minPrice);
  const max = parseDecimal(maxPrice);

  if (min !== null) priceFilter.gte = min;
  if (max !== null) priceFilter.lte = max;
  if (Object.keys(priceFilter).length > 0) {
    where.price = priceFilter;
  }

  if (normalizeBoolean(inStock, false)) {
    where.stock = { gt: 0 };
  }

  if (normalizeBoolean(outOfStock, false)) {
    where.stock = { lte: 0 };
  }

  return where;
}

const getAllProducts = asyncHandler(async (request, response) => {
  const mode = request.query.mode || "";
  const page = parsePositiveInt(request.query.page, 1);
  const limit = parsePositiveInt(request.query.limit, 12);
  const orderBy = buildOrderBy(request.query.sort || request.query.sortBy || "defaultSort");
  const where = buildWhereClause(request.query);

  if (mode === "admin") {
    const adminProducts = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy,
    });

    return response.json(adminProducts);
  }

  const products = await prisma.product.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      seller: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy,
  });

  return response.json(products);
});

const createProduct = asyncHandler(async (request, response) => {
  const {
    sellerId,
    merchantId,
    slug,
    title,
    mainImage,
    price,
    description,
    brand,
    manufacturer,
    categoryId,
    stock,
    inStock,
    condition,
    status,
    material,
    color,
    roomType,
    widthCm,
    depthCm,
    heightCm,
    weightKg,
    yearUsed,
    isNegotiable,
    city,
    province,
    pickupAddress,
    images,
  } = request.body;

  const finalSellerId = sellerId || merchantId;
  const finalBrand = brand || manufacturer || null;
  const finalStock = normalizeStock(stock, inStock);
  const finalCondition = normalizeCondition(condition);
  const finalStatus = normalizeStatus(status);

  if (!title) throw new AppError("Missing required field: title", 400);
  if (!finalSellerId) throw new AppError("Missing required field: sellerId", 400);
  if (!slug) throw new AppError("Missing required field: slug", 400);
  if (!price) throw new AppError("Missing required field: price", 400);
  if (!categoryId) throw new AppError("Missing required field: categoryId", 400);
  if (!city) throw new AppError("Missing required field: city", 400);

  const seller = await prisma.user.findFirst({
    where: {
      id: finalSellerId,
      role: UserRole.SELLER,
    },
  });

  if (!seller) {
    throw new AppError("Seller not found", 404);
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const existingSlug = await prisma.product.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    throw new AppError("Slug already exists", 400);
  }

  const product = await prisma.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: {
        sellerId: finalSellerId,
        slug,
        title,
        mainImage: mainImage || null,
        price: String(price),
        description: description || "",
        categoryId,
        stock: finalStock,
        brand: finalBrand,
        condition: finalCondition,
        status: finalStatus,
        material: material || null,
        color: color || null,
        roomType: roomType || null,
        widthCm: widthCm ?? null,
        depthCm: depthCm ?? null,
        heightCm: heightCm ?? null,
        weightKg: weightKg ?? null,
        yearUsed: yearUsed ?? null,
        isNegotiable: normalizeBoolean(isNegotiable, false),
        city,
        province: province || null,
        pickupAddress: pickupAddress || null,
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const imageList = Array.isArray(images) ? images : [];
    const normalizedImages = imageList
      .filter((item) => typeof item === "string" && item.trim() !== "")
      .map((item) => item.trim());

    if (normalizedImages.length > 0) {
      await tx.productImage.createMany({
        data: normalizedImages.map((imageUrl, index) => ({
          productId: createdProduct.id,
          imageUrl,
          altText: createdProduct.title,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      });
    } else if (mainImage) {
      await tx.productImage.create({
        data: {
          productId: createdProduct.id,
          imageUrl: mainImage,
          altText: createdProduct.title,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }

    return createdProduct;
  });

  return response.status(201).json(product);
});

const updateProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const {
    sellerId,
    merchantId,
    slug,
    title,
    mainImage,
    price,
    description,
    brand,
    manufacturer,
    categoryId,
    stock,
    inStock,
    condition,
    status,
    material,
    color,
    roomType,
    widthCm,
    depthCm,
    heightCm,
    weightKg,
    yearUsed,
    isNegotiable,
    city,
    province,
    pickupAddress,
    images,
  } = request.body;

  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  const finalSellerId = sellerId || merchantId || existingProduct.sellerId;
  const finalBrand =
    brand !== undefined
      ? brand
      : manufacturer !== undefined
      ? manufacturer
      : existingProduct.brand;

  if (finalSellerId !== existingProduct.sellerId) {
    const seller = await prisma.user.findFirst({
      where: {
        id: finalSellerId,
        role: UserRole.SELLER,
      },
    });

    if (!seller) {
      throw new AppError("Seller not found", 404);
    }
  }

  if (categoryId && categoryId !== existingProduct.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }
  }

  if (slug && slug !== existingProduct.slug) {
    const duplicatedSlug = await prisma.product.findUnique({
      where: { slug },
    });

    if (duplicatedSlug) {
      throw new AppError("Slug already exists", 400);
    }
  }

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: {
        sellerId: finalSellerId,
        slug: slug ?? existingProduct.slug,
        title: title ?? existingProduct.title,
        mainImage: mainImage ?? existingProduct.mainImage,
        price: price !== undefined ? String(price) : existingProduct.price,
        description: description ?? existingProduct.description,
        categoryId: categoryId ?? existingProduct.categoryId,
        stock:
          stock !== undefined || inStock !== undefined
            ? normalizeStock(stock, inStock)
            : existingProduct.stock,
        brand: finalBrand,
        condition:
          condition !== undefined
            ? normalizeCondition(condition, existingProduct.condition)
            : existingProduct.condition,
        status:
          status !== undefined
            ? normalizeStatus(status, existingProduct.status)
            : existingProduct.status,
        material: material ?? existingProduct.material,
        color: color ?? existingProduct.color,
        roomType: roomType ?? existingProduct.roomType,
        widthCm: widthCm ?? existingProduct.widthCm,
        depthCm: depthCm ?? existingProduct.depthCm,
        heightCm: heightCm ?? existingProduct.heightCm,
        weightKg: weightKg ?? existingProduct.weightKg,
        yearUsed: yearUsed ?? existingProduct.yearUsed,
        isNegotiable:
          isNegotiable !== undefined
            ? normalizeBoolean(isNegotiable, existingProduct.isNegotiable)
            : existingProduct.isNegotiable,
        city: city ?? existingProduct.city,
        province: province ?? existingProduct.province,
        pickupAddress: pickupAddress ?? existingProduct.pickupAddress,
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        images: true,
      },
    });

    if (Array.isArray(images)) {
      await tx.productImage.deleteMany({
        where: { productId: id },
      });

      const normalizedImages = images
        .filter((item) => typeof item === "string" && item.trim() !== "")
        .map((item) => item.trim());

      if (normalizedImages.length > 0) {
        await tx.productImage.createMany({
          data: normalizedImages.map((imageUrl, index) => ({
            productId: id,
            imageUrl,
            altText: product.title,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        });
      }
    }

    return product;
  });

  return response.status(200).json(updatedProduct);
});

const deleteProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  const relatedOrderItems = await prisma.orderItem.count({
    where: {
      productId: id,
    },
  });

  if (relatedOrderItems > 0) {
    throw new AppError("Cannot delete product because it already exists in orders", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({
      where: { productId: id },
    });

    await tx.wishlist.deleteMany({
      where: { productId: id },
    });

    await tx.review.deleteMany({
      where: { productId: id },
    });

    await tx.productImage.deleteMany({
      where: { productId: id },
    });

    await tx.product.delete({
      where: { id },
    });
  });

  return response.status(204).send();
});

const searchProducts = asyncHandler(async (request, response) => {
  const { query } = request.query;

  if (!query) {
    throw new AppError("Query parameter is required", 400);
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { brand: { contains: query } },
        { material: { contains: query } },
        { roomType: { contains: query } },
        { city: { contains: query } },
      ],
    },
    include: {
      category: true,
      seller: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return response.json(products);
});

const getProductById = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      seller: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatar: true,
          isActive: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return response.status(200).json(product);
});

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductById,
};
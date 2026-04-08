const {
  PrismaClient,
  UserRole,
  ProductCondition,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  DeliveryMethod,
  NotificationType,
  NotificationPriority,
} = require("@prisma/client");

const prisma = new PrismaClient();

const demoCategories = [
  {
    name: "Living Room",
    slug: "living-room",
    description: "Used furniture for sofas, coffee tables, TV stands, and living room storage.",
  },
  {
    name: "Bedroom",
    slug: "bedroom",
    description: "Second-hand bedroom furniture such as bed frames, wardrobes, and nightstands.",
  },
  {
    name: "Dining Room",
    slug: "dining-room",
    description: "Pre-owned dining tables, chairs, and sideboards.",
  },
  {
    name: "Office",
    slug: "office",
    description: "Used office desks, chairs, shelves, and cabinets.",
  },
  {
    name: "Storage",
    slug: "storage",
    description: "Bookshelves, cabinets, and storage units for home organization.",
  },
  {
    name: "Outdoor",
    slug: "outdoor",
    description: "Used outdoor benches, patio chairs, and garden furniture.",
  },
];

const demoProducts = [
  {
    slug: "solid-wood-sofa-set-q7",
    title: "Solid Wood Sofa Set",
    description:
      "A used solid wood sofa set with removable cushions. Suitable for apartments or family living rooms. Minor scratches on the armrests, but the frame is still sturdy and comfortable for daily use.",
    price: "6500000",
    condition: ProductCondition.GOOD,
    status: ProductStatus.AVAILABLE,
    stock: 1,
    brand: "No Brand",
    material: "Oak Wood",
    color: "Brown",
    roomType: "Living Room",
    widthCm: 210,
    depthCm: 85,
    heightCm: 88,
    weightKg: 48,
    yearUsed: 3,
    isNegotiable: true,
    city: "Ho Chi Minh City",
    province: "Ho Chi Minh",
    pickupAddress: "District 7, Ho Chi Minh City",
    mainImage: "used-sofa-1.jpg",
    categorySlug: "living-room",
    sellerEmail: "seller1@usedfurniture.vn",
    images: ["used-sofa-1.jpg", "used-sofa-2.jpg", "used-sofa-3.jpg"],
  },
  {
    slug: "round-dining-table-4-seats-tp",
    title: "Round Dining Table with 4 Chairs",
    description:
      "A compact used dining set for small families. Includes one round table and four matching chairs. The tabletop has light wear marks, but the structure remains stable and practical.",
    price: "4200000",
    condition: ProductCondition.GOOD,
    status: ProductStatus.AVAILABLE,
    stock: 1,
    brand: "IKEA",
    material: "Rubber Wood",
    color: "Natural Wood",
    roomType: "Dining Room",
    widthCm: 120,
    depthCm: 120,
    heightCm: 75,
    weightKg: 35,
    yearUsed: 2,
    isNegotiable: false,
    city: "Da Nang",
    province: "Da Nang",
    pickupAddress: "Hai Chau, Da Nang",
    mainImage: "dining-set-1.jpg",
    categorySlug: "dining-room",
    sellerEmail: "seller2@usedfurniture.vn",
    images: ["dining-set-1.jpg", "dining-set-2.jpg"],
  },
  {
    slug: "ergonomic-office-chair-mesh-bk",
    title: "Ergonomic Mesh Office Chair",
    description:
      "A pre-owned ergonomic office chair with adjustable height and reclining backrest. Wheels and hydraulic lift work normally. Best for study desks or home office setups.",
    price: "1250000",
    condition: ProductCondition.LIKE_NEW,
    status: ProductStatus.AVAILABLE,
    stock: 1,
    brand: "ErgoHome",
    material: "Mesh and Plastic",
    color: "Black",
    roomType: "Office",
    widthCm: 64,
    depthCm: 62,
    heightCm: 110,
    weightKg: 11,
    yearUsed: 1,
    isNegotiable: true,
    city: "Ho Chi Minh City",
    province: "Ho Chi Minh",
    pickupAddress: "Thu Duc City, Ho Chi Minh City",
    mainImage: "office-chair-1.jpg",
    categorySlug: "office",
    sellerEmail: "seller1@usedfurniture.vn",
    images: ["office-chair-1.jpg", "office-chair-2.jpg"],
  },
  {
    slug: "3-door-wardrobe-white-hn",
    title: "3-Door Wardrobe",
    description:
      "A second-hand 3-door wardrobe with hanging space and bottom drawers. Suitable for bedrooms or rental apartments. Some edge wear is visible, but storage capacity is excellent.",
    price: "3900000",
    condition: ProductCondition.FAIR,
    status: ProductStatus.AVAILABLE,
    stock: 1,
    brand: "No Brand",
    material: "Engineered Wood",
    color: "White",
    roomType: "Bedroom",
    widthCm: 160,
    depthCm: 55,
    heightCm: 200,
    weightKg: 78,
    yearUsed: 4,
    isNegotiable: true,
    city: "Ha Noi",
    province: "Ha Noi",
    pickupAddress: "Cau Giay, Ha Noi",
    mainImage: "wardrobe-1.jpg",
    categorySlug: "bedroom",
    sellerEmail: "seller2@usedfurniture.vn",
    images: ["wardrobe-1.jpg", "wardrobe-2.jpg", "wardrobe-3.jpg"],
  },
  {
    slug: "oak-coffee-table-minimalist-bd",
    title: "Minimalist Oak Coffee Table",
    description:
      "A small oak coffee table in minimalist style. Ideal for living rooms, studios, or waiting areas. Surface is in good condition and easy to clean.",
    price: "980000",
    condition: ProductCondition.GOOD,
    status: ProductStatus.AVAILABLE,
    stock: 1,
    brand: "No Brand",
    material: "Oak Wood",
    color: "Light Brown",
    roomType: "Living Room",
    widthCm: 100,
    depthCm: 50,
    heightCm: 42,
    weightKg: 14,
    yearUsed: 2,
    isNegotiable: false,
    city: "Binh Duong",
    province: "Binh Duong",
    pickupAddress: "Thu Dau Mot, Binh Duong",
    mainImage: "coffee-table-1.jpg",
    categorySlug: "living-room",
    sellerEmail: "seller3@usedfurniture.vn",
    images: ["coffee-table-1.jpg", "coffee-table-2.jpg"],
  },
  {
    slug: "metal-bookshelf-5-tier-dn",
    title: "5-Tier Metal Bookshelf",
    description:
      "A used 5-tier bookshelf with black metal frame and wooden shelves. Suitable for books, decorations, or office storage. Strong frame and clean overall appearance.",
    price: "1450000",
    condition: ProductCondition.LIKE_NEW,
    status: ProductStatus.AVAILABLE,
    stock: 1,
    brand: "HomeSpace",
    material: "Metal and MDF",
    color: "Black / Walnut",
    roomType: "Storage",
    widthCm: 80,
    depthCm: 30,
    heightCm: 180,
    weightKg: 19,
    yearUsed: 1,
    isNegotiable: false,
    city: "Can Tho",
    province: "Can Tho",
    pickupAddress: "Ninh Kieu, Can Tho",
    mainImage: "bookshelf-1.jpg",
    categorySlug: "storage",
    sellerEmail: "seller3@usedfurniture.vn",
    images: ["bookshelf-1.jpg", "bookshelf-2.jpg"],
  },
  {
    slug: "queen-bed-frame-upholstered-vt",
    title: "Queen Upholstered Bed Frame",
    description:
      "A used queen-size bed frame with soft fabric headboard. The frame is stable and suitable for modern bedrooms. One leg was replaced, so the price is discounted.",
    price: "2800000",
    condition: ProductCondition.FAIR,
    status: ProductStatus.AVAILABLE,
    stock: 1,
    brand: "SleepNest",
    material: "Fabric and Wood",
    color: "Gray",
    roomType: "Bedroom",
    widthCm: 160,
    depthCm: 200,
    heightCm: 110,
    weightKg: 42,
    yearUsed: 3,
    isNegotiable: true,
    city: "Vung Tau",
    province: "Ba Ria - Vung Tau",
    pickupAddress: "Vung Tau City",
    mainImage: "bed-frame-1.jpg",
    categorySlug: "bedroom",
    sellerEmail: "seller2@usedfurniture.vn",
    images: ["bed-frame-1.jpg", "bed-frame-2.jpg"],
  },
  {
    slug: "tv-stand-industrial-style-hcm",
    title: "Industrial Style TV Stand",
    description:
      "A pre-owned TV stand with open shelves and side cabinet. Suitable for TVs up to 55 inches. Some minor paint fading, but fully usable and visually neat.",
    price: "1750000",
    condition: ProductCondition.GOOD,
    status: ProductStatus.SOLD,
    stock: 0,
    brand: "Urban Loft",
    material: "Metal and Engineered Wood",
    color: "Rustic Brown",
    roomType: "Living Room",
    widthCm: 140,
    depthCm: 40,
    heightCm: 55,
    weightKg: 24,
    yearUsed: 2,
    isNegotiable: false,
    city: "Ho Chi Minh City",
    province: "Ho Chi Minh",
    pickupAddress: "Binh Thanh, Ho Chi Minh City",
    mainImage: "tv-stand-1.jpg",
    categorySlug: "living-room",
    sellerEmail: "seller1@usedfurniture.vn",
    images: ["tv-stand-1.jpg", "tv-stand-2.jpg"],
  },
];

async function clearDatabase() {
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const admin = await prisma.user.create({
    data: {
      fullName: "Admin Demo",
      email: "admin@usedfurniture.vn",
      password: "admin123",
      phone: "0900000001",
      role: UserRole.ADMIN,
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      fullName: "Nguyen Minh Khang",
      email: "seller1@usedfurniture.vn",
      password: "seller123",
      phone: "0900000002",
      role: UserRole.SELLER,
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      fullName: "Tran Bao Chau",
      email: "seller2@usedfurniture.vn",
      password: "seller123",
      phone: "0900000003",
      role: UserRole.SELLER,
    },
  });

  const seller3 = await prisma.user.create({
    data: {
      fullName: "Le Hoang Phuc",
      email: "seller3@usedfurniture.vn",
      password: "seller123",
      phone: "0900000004",
      role: UserRole.SELLER,
    },
  });

  const customer = await prisma.user.create({
    data: {
      fullName: "Pham Thu An",
      email: "customer1@usedfurniture.vn",
      password: "customer123",
      phone: "0900000005",
      role: UserRole.CUSTOMER,
    },
  });

  return { admin, seller1, seller2, seller3, customer };
}

async function seedAddresses(customerId) {
  const homeAddress = await prisma.address.create({
    data: {
      userId: customerId,
      label: "Home",
      recipientName: "Pham Thu An",
      phone: "0900000005",
      line1: "123 Nguyen Huu Canh Street",
      ward: "Ward 22",
      district: "Binh Thanh District",
      city: "Ho Chi Minh City",
      province: "Ho Chi Minh",
      country: "Vietnam",
      isDefault: true,
    },
  });

  return { homeAddress };
}

async function seedCategories() {
  const categories = {};

  for (const category of demoCategories) {
    const createdCategory = await prisma.category.create({
      data: category,
    });

    categories[createdCategory.slug] = createdCategory;
  }

  return categories;
}

async function seedProducts(users, categories) {
  const sellersByEmail = {
    [users.seller1.email]: users.seller1,
    [users.seller2.email]: users.seller2,
    [users.seller3.email]: users.seller3,
  };

  const createdProducts = {};

  for (const product of demoProducts) {
    const { images, categorySlug, sellerEmail, ...productData } = product;

    const createdProduct = await prisma.product.create({
      data: {
        ...productData,
        sellerId: sellersByEmail[sellerEmail].id,
        categoryId: categories[categorySlug].id,
      },
    });

    createdProducts[createdProduct.slug] = createdProduct;

    await prisma.productImage.createMany({
      data: images.map((imageUrl, index) => ({
        productId: createdProduct.id,
        imageUrl,
        altText: createdProduct.title,
        sortOrder: index,
        isPrimary: index === 0,
      })),
    });
  }

  return createdProducts;
}

async function seedCart(customerId, products) {
  const cart = await prisma.cart.create({
    data: {
      userId: customerId,
    },
  });

  await prisma.cartItem.createMany({
    data: [
      {
        cartId: cart.id,
        productId: products["solid-wood-sofa-set-q7"].id,
        quantity: 1,
      },
      {
        cartId: cart.id,
        productId: products["metal-bookshelf-5-tier-dn"].id,
        quantity: 1,
      },
    ],
  });
}

async function seedWishlist(customerId, products) {
  await prisma.wishlist.createMany({
    data: [
      {
        userId: customerId,
        productId: products["ergonomic-office-chair-mesh-bk"].id,
      },
      {
        userId: customerId,
        productId: products["queen-bed-frame-upholstered-vt"].id,
      },
    ],
  });
}

async function seedReviews(customerId, products) {
  await prisma.review.createMany({
    data: [
      {
        userId: customerId,
        productId: products["round-dining-table-4-seats-tp"].id,
        rating: 5,
        comment: "The dining set arrived in good condition and looks exactly like the photos.",
      },
      {
        userId: customerId,
        productId: products["metal-bookshelf-5-tier-dn"].id,
        rating: 4,
        comment: "Easy to place in a study room. Sturdy shelves and good value for a used item.",
      },
    ],
  });
}

async function seedOrder(customer, address, products) {
  const orderedProduct = products["tv-stand-industrial-style-hcm"];

  await prisma.order.create({
    data: {
      orderNumber: "UF-2026-0001",
      userId: customer.id,
      shippingAddressId: address.id,
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      deliveryMethod: DeliveryMethod.DELIVERY,
      paymentStatus: PaymentStatus.PAID,
      subtotal: "1750000",
      shippingFee: "150000",
      discount: "50000",
      total: "1850000",
      note: "Please call before delivery.",
      shippingRecipientName: address.recipientName,
      shippingPhone: address.phone,
      shippingLine1: address.line1,
      shippingWard: address.ward,
      shippingDistrict: address.district,
      shippingCity: address.city,
      shippingProvince: address.province,
      shippingCountry: address.country,
      items: {
        create: [
          {
            productId: orderedProduct.id,
            productTitle: orderedProduct.title,
            unitPrice: "1750000",
            quantity: 1,
            subtotal: "1750000",
            conditionAtOrder: ProductCondition.GOOD,
          },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.BANK_TRANSFER,
          status: PaymentStatus.PAID,
          transactionId: "TXN-UF-2026-0001",
          amount: "1850000",
          paidAt: new Date("2026-03-28T10:00:00.000Z"),
        },
      },
    },
  });
}

async function seedNotifications(customerId) {
  await prisma.notification.createMany({
    data: [
      {
        userId: customerId,
        title: "Order delivered successfully",
        message: "Your order UF-2026-0001 has been delivered successfully.",
        type: NotificationType.ORDER_UPDATE,
        priority: NotificationPriority.NORMAL,
        metadata: { orderNumber: "UF-2026-0001", status: "DELIVERED" },
      },
      {
        userId: customerId,
        title: "Payment received",
        message: "We received your bank transfer for order UF-2026-0001.",
        type: NotificationType.PAYMENT_STATUS,
        priority: NotificationPriority.HIGH,
        metadata: { orderNumber: "UF-2026-0001", paymentStatus: "PAID" },
      },
    ],
  });
}

async function insertDemoData() {
  console.log("Clearing old data...");
  await clearDatabase();

  console.log("Seeding users...");
  const users = await seedUsers();

  console.log("Seeding addresses...");
  const { homeAddress } = await seedAddresses(users.customer.id);

  console.log("Seeding categories...");
  const categories = await seedCategories();

  console.log("Seeding products...");
  const products = await seedProducts(users, categories);

  console.log("Seeding cart...");
  await seedCart(users.customer.id, products);

  console.log("Seeding wishlist...");
  await seedWishlist(users.customer.id, products);

  console.log("Seeding reviews...");
  await seedReviews(users.customer.id, products);

  console.log("Seeding order...");
  await seedOrder(users.customer, homeAddress, products);

  console.log("Seeding notifications...");
  await seedNotifications(users.customer.id);

  console.log("Used furniture demo data inserted successfully!");
}

insertDemoData()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
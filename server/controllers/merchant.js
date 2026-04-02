const { PrismaClient, UserRole } = require("@prisma/client");
const prisma = new PrismaClient();

async function getAllMerchants(request, response) {
  try {
    const sellers = await prisma.user.findMany({
      where: {
        role: UserRole.SELLER,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return response.json(sellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return response.status(500).json({ error: "Error fetching sellers" });
  }
}

async function getMerchantById(request, response) {
  try {
    const { id } = request.params;

    const seller = await prisma.user.findFirst({
      where: {
        id,
        role: UserRole.SELLER,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!seller) {
      return response.status(404).json({ error: "Seller not found" });
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return response.json({
      ...seller,
      products,
    });
  } catch (error) {
    console.error("Error fetching seller:", error);
    return response.status(500).json({ error: "Error fetching seller" });
  }
}

async function createMerchant(request, response) {
  try {
    const {
      name,
      fullName,
      email,
      phone,
      avatar,
      password,
      isActive,
      status,
    } = request.body;

    const seller = await prisma.user.create({
      data: {
        fullName: fullName || name,
        email,
        phone: phone || null,
        avatar: avatar || null,
        password: password || "seller123",
        role: UserRole.SELLER,
        isActive:
          typeof isActive === "boolean"
            ? isActive
            : status
            ? String(status).toLowerCase() === "active"
            : true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return response.status(201).json(seller);
  } catch (error) {
    console.error("Error creating seller:", error);
    return response.status(500).json({ error: "Error creating seller" });
  }
}

async function updateMerchant(request, response) {
  try {
    const { id } = request.params;
    const {
      name,
      fullName,
      email,
      phone,
      avatar,
      isActive,
      status,
    } = request.body;

    const existingSeller = await prisma.user.findFirst({
      where: {
        id,
        role: UserRole.SELLER,
      },
    });

    if (!existingSeller) {
      return response.status(404).json({ error: "Seller not found" });
    }

    const seller = await prisma.user.update({
      where: {
        id,
      },
      data: {
        fullName: fullName || name || existingSeller.fullName,
        email: email ?? existingSeller.email,
        phone: phone ?? existingSeller.phone,
        avatar: avatar ?? existingSeller.avatar,
        isActive:
          typeof isActive === "boolean"
            ? isActive
            : status
            ? String(status).toLowerCase() === "active"
            : existingSeller.isActive,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return response.json(seller);
  } catch (error) {
    console.error("Error updating seller:", error);
    return response.status(500).json({ error: "Error updating seller" });
  }
}

async function deleteMerchant(request, response) {
  try {
    const { id } = request.params;

    const existingSeller = await prisma.user.findFirst({
      where: {
        id,
        role: UserRole.SELLER,
      },
    });

    if (!existingSeller) {
      return response.status(404).json({ error: "Seller not found" });
    }

    const productCount = await prisma.product.count({
      where: {
        sellerId: id,
      },
    });

    if (productCount > 0) {
      return response.status(400).json({
        error: "Cannot delete seller with existing products",
      });
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting seller:", error);
    return response.status(500).json({ error: "Error deleting seller" });
  }
}

module.exports = {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
};
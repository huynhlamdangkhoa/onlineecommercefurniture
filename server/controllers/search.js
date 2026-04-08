const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function searchProducts(request, response) {
  try {
    const query = (request.query.query || "").trim();

    if (!query) {
      return response.status(200).json([]);
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
            },
          },
          {
            description: {
              contains: query,
            },
          },
        ],
      },
    });

    return response.status(200).json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    return response.status(500).json({
      error: "Error searching products",
    });
  }
}

module.exports = { searchProducts };
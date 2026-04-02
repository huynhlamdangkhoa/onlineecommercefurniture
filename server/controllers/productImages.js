const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getSingleProductImages(request, response) {
  try {
    const { id } = request.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return response.status(404).json({ error: "Product not found" });
    }

    const images = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    });

    return response.json(images);
  } catch (error) {
    console.error("Error fetching product images:", error);
    return response.status(500).json({ error: "Error fetching product images" });
  }
}

async function createImage(request, response) {
  try {
    const {
      productId,
      productID,
      imageUrl,
      image,
      altText,
      sortOrder,
      isPrimary,
    } = request.body;

    const finalProductId = productId || productID;
    const finalImageUrl = imageUrl || image;

    if (!finalProductId) {
      return response.status(400).json({ error: "productId is required" });
    }

    if (!finalImageUrl) {
      return response.status(400).json({ error: "imageUrl is required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: finalProductId },
    });

    if (!product) {
      return response.status(404).json({ error: "Product not found" });
    }

    const createdImage = await prisma.productImage.create({
      data: {
        productId: finalProductId,
        imageUrl: finalImageUrl,
        altText: altText || product.title,
        sortOrder:
          sortOrder !== undefined && sortOrder !== null
            ? Number(sortOrder)
            : 0,
        isPrimary: Boolean(isPrimary),
      },
    });

    return response.status(201).json(createdImage);
  } catch (error) {
    console.error("Error creating image:", error);
    return response.status(500).json({ error: "Error creating image" });
  }
}

async function updateImage(request, response) {
  try {
    const { id } = request.params;
    const {
      productId,
      productID,
      imageUrl,
      image,
      altText,
      sortOrder,
      isPrimary,
    } = request.body;

    const existingImage = await prisma.productImage.findUnique({
      where: { id },
    });

    if (!existingImage) {
      return response.status(404).json({ error: "Image not found" });
    }

    const finalProductId = productId || productID || existingImage.productId;
    const finalImageUrl = imageUrl || image || existingImage.imageUrl;

    if (finalProductId !== existingImage.productId) {
      const product = await prisma.product.findUnique({
        where: { id: finalProductId },
      });

      if (!product) {
        return response.status(404).json({ error: "Product not found" });
      }
    }

    const updatedImage = await prisma.productImage.update({
      where: { id },
      data: {
        productId: finalProductId,
        imageUrl: finalImageUrl,
        altText:
          altText !== undefined ? altText : existingImage.altText,
        sortOrder:
          sortOrder !== undefined && sortOrder !== null
            ? Number(sortOrder)
            : existingImage.sortOrder,
        isPrimary:
          isPrimary !== undefined ? Boolean(isPrimary) : existingImage.isPrimary,
      },
    });

    return response.json(updatedImage);
  } catch (error) {
    console.error("Error updating image:", error);
    return response.status(500).json({ error: "Error updating image" });
  }
}

async function deleteImage(request, response) {
  try {
    const { id } = request.params;

    const existingImage = await prisma.productImage.findUnique({
      where: { id },
    });

    if (!existingImage) {
      return response.status(404).json({ error: "Image not found" });
    }

    await prisma.productImage.delete({
      where: { id },
    });

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting image:", error);
    return response.status(500).json({ error: "Error deleting image" });
  }
}

module.exports = {
  getSingleProductImages,
  createImage,
  updateImage,
  deleteImage,
};
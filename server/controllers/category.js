const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { asyncHandler, AppError } = require("../utills/errorHandler");

function slugify(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const createCategory = asyncHandler(async (request, response) => {
  const { name, slug, description, parentId } = request.body;

  if (!name || name.trim().length === 0) {
    throw new AppError("Category name is required", 400);
  }

  const finalSlug = (slug && slug.trim()) || slugify(name);

  if (!finalSlug) {
    throw new AppError("Category slug is required", 400);
  }

  const existingSlug = await prisma.category.findUnique({
    where: { slug: finalSlug },
  });

  if (existingSlug) {
    throw new AppError("Category slug already exists", 400);
  }

  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parentCategory) {
      throw new AppError("Parent category not found", 404);
    }
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      slug: finalSlug,
      description: description || null,
      parentId: parentId || null,
    },
  });

  return response.status(201).json(category);
});

const updateCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { name, slug, description, parentId } = request.body;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  const finalName = name?.trim() || existingCategory.name;
  const finalSlug =
    (slug && slug.trim()) ||
    (name ? slugify(name) : existingCategory.slug);

  if (!finalName) {
    throw new AppError("Category name is required", 400);
  }

  if (!finalSlug) {
    throw new AppError("Category slug is required", 400);
  }

  const duplicatedSlug = await prisma.category.findFirst({
    where: {
      slug: finalSlug,
      NOT: { id },
    },
  });

  if (duplicatedSlug) {
    throw new AppError("Category slug already exists", 400);
  }

  if (parentId) {
    if (parentId === id) {
      throw new AppError("A category cannot be its own parent", 400);
    }

    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parentCategory) {
      throw new AppError("Parent category not found", 404);
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      name: finalName,
      slug: finalSlug,
      description:
        description !== undefined ? description : existingCategory.description,
      parentId: parentId !== undefined ? parentId || null : existingCategory.parentId,
    },
  });

  return response.status(200).json(updatedCategory);
});

const deleteCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  const productsWithCategory = await prisma.product.findFirst({
    where: { categoryId: id },
  });

  if (productsWithCategory) {
    throw new AppError("Cannot delete category that has products", 400);
  }

  const childCategory = await prisma.category.findFirst({
    where: { parentId: id },
  });

  if (childCategory) {
    throw new AppError("Cannot delete category that has child categories", 400);
  }

  await prisma.category.delete({
    where: { id },
  });

  return response.status(204).send();
});

const getCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
      products: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          status: true,
          stock: true,
          mainImage: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return response.status(200).json(category);
});

const getAllCategories = asyncHandler(async (request, response) => {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return response.json(categories);
});

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategories,
};
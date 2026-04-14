import React from "react";
import ProductItem from "./ProductItem";
import Heading from "./Heading";

const featuredProducts = [
  {
    id: "featured-1",
    title: "Industrial Style TV Stand",
    price: "75",
    slug: "tv-stand-industrial-style-hcm",
    mainImage: "tv-stand-1.jpg",
  },
  {
    id: "featured-2",
    title: "Queen Upholstered Bed Frame",
    price: "112",
    slug: "queen-bed-frame-upholstered-vt",
    mainImage: "bed-frame-1.jpg",
  },
  {
    id: "featured-3",
    title: "5-Tier Metal Bookshelf",
    price: "58",
    slug: "metal-bookshelf-5-tier-dn",
    mainImage: "bookshelf-1.jpg",
  },
  {
    id: "featured-4",
    title: "Minimalist Oak Coffee Table",
    price: "39",
    slug: "oak-coffee-table-minimalist-bd",
    mainImage: "coffee-table-1.jpg",
  },
  {
    id: "featured-5",
    title: "3-Door Wardrobe",
    price: "156",
    slug: "3-door-wardrobe-white-hn",
    mainImage: "wardrobe-1.jpg",
  },
  {
    id: "featured-6",
    title: "Ergonomic Mesh Office Chair",
    price: "50",
    slug: "ergonomic-office-chair-mesh-bk",
    mainImage: "office-chair-1.jpg",
  },
  {
    id: "featured-7",
    title: "Round Dining Table with 4 Chairs",
    price: "168",
    slug: "round-dining-table-4-seats-tp",
    mainImage: "dining-set-1.jpg",
  },
  {
    id: "featured-8",
    title: "Solid Wood Sofa Set",
    price: "260",
    slug: "solid-wood-sofa-set-q7",
    mainImage: "used-sofa-1.jpg",
  },
];

const ProductsSection = () => {
  return (
    <div className="bg-[#00d08e] border-t-4 border-white">
      <div className="max-w-screen-2xl mx-auto pt-20">
        <Heading title="FEATURED PRODUCTS" />
        <div className="grid grid-cols-4 justify-items-center max-w-screen-2xl mx-auto py-10 gap-x-2 px-10 gap-y-8 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          {featuredProducts.map((product) => (
            <ProductItem key={product.id} product={product as any} color="white" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductsSection;
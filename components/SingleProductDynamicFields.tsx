"use client";
import React, { useState } from "react";
import QuantityInput from "./QuantityInput";
import AddToCartSingleProductBtn from "./AddToCartSingleProductBtn";
import BuyNowSingleProductBtn from "./BuyNowSingleProductBtn";

type SingleProductDynamicFieldsProps = {
  product: Product & { stock?: number };
};

const SingleProductDynamicFields = ({
  product,
}: SingleProductDynamicFieldsProps) => {
  const [quantityCount, setQuantityCount] = useState<number>(1);

  const isAvailable = Number(product?.stock || 0) > 0;

  return (
    <>
      <QuantityInput
        quantityCount={quantityCount}
        setQuantityCount={setQuantityCount}
      />

      {isAvailable && (
        <div className="flex gap-x-5 max-[500px]:flex-col max-[500px]:items-center max-[500px]:gap-y-1">
          <AddToCartSingleProductBtn
            quantityCount={quantityCount}
            product={product}
          />
          <BuyNowSingleProductBtn
            quantityCount={quantityCount}
            product={product}
          />
        </div>
      )}
    </>
  );
};

export default SingleProductDynamicFields;
"use client";
import { usePaginationStore } from "@/app/_zustand/paginationStore";
import React from "react";

const Pagination = () => {
  // getting from Zustand store current page and methods for incrementing and decrementing current page
  const { page, incrementPage, decrementPage } = usePaginationStore();
  return (
    <div className="join flex justify-center py-16">
      <button
        className="join-item btn btn-lg bg-[#00d08e] text-white hover:bg-white hover:text-[#00d08e]"
        onClick={() => decrementPage()}
      >
        «
      </button>
      <button className="join-item btn btn-lg bg-[#00d08e] text-white hover:bg-white hover:text-[#00d08e]">
        Page {page}
      </button>
      <button
        className="join-item btn btn-lg bg-[#00d08e] text-white hover:bg-white hover:text-[#00d08e]"
        onClick={() => incrementPage()}
      >
        »
      </button>
    </div>
  );
};

export default Pagination;

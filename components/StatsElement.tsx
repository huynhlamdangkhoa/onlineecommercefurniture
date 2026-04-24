// *********************
// IN DEVELOPMENT
// *********************

import React from "react";
import { FaArrowUp } from "react-icons/fa6";


const StatsElement = () => {
  return (
    <div className="w-80 h-32 bg-[#00d08e] text-white flex flex-col justify-center items-center rounded-md max-md:w-full">
      <h4 className="text-xl text-white">Statistical features</h4>
      <p className="text-2xl font-bold">0</p>
      <p className="text-green-300 flex gap-x-1 items-center"><FaArrowUp />Futurework</p>
    </div>
  );
};

export default StatsElement;

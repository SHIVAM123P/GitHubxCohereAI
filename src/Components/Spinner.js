import React from 'react';

const Spinner = () => (
  <div className="flex justify-center items-center h-24">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500 rounded-full animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-pink-500 rounded-full animate-spin"></div>
    </div>
  </div>
);

export default Spinner;
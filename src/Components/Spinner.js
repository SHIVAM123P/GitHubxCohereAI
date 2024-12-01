import React, { useEffect, useState } from 'react';
import './Spinner.css';

const Spinner = () => {
  const [loadingText, setLoadingText] = useState('Loading...');

  useEffect(() => {
    // Change loading text after 2 seconds
    const timer = setTimeout(() => {
      setLoadingText('Just a Sec...');
    }, 4000);

    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center mt-20"> {/* Add margin-top to center it further down */}
      <div className="relative w-16 h-16 mb-2"> {/* Adjusted margin-bottom for spacing */}
        {/* Outer neon glow */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500 rounded-full animate-pulse glow"></div>
        {/* Inner spinning circle with light blue color */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-light-blue-500 rounded-full animate-spin"></div>
      </div>
      <span className="text-cyan-500 font-semibold">{loadingText}</span>
    </div>
  );
};

export default Spinner;

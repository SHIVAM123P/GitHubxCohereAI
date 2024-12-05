import React, { useEffect, useState } from 'react';
import { ScanSearch } from 'lucide-react';

const Spinner = () => {
  const [loadingText, setLoadingText] = useState('Scanning Your GitHub Profile...');
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Dynamic loading dots
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    // Change loading text progression
    // const textTimer = setTimeout(() => {
    //   setLoadingText('Analyzing Repositories...');
    // }, 3000);

    // const finalTimer = setTimeout(() => {
    //   setLoadingText('Almost there...');
    // }, 6000);

    // Cleanup timers
    return () => {
      clearInterval(interval);
      // clearTimeout(textTimer);
      // clearTimeout(finalTimer);
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center mt-12 text-white"> 
      <div className="relative w-24 h-24 mb-4">
        {/* Outer neon glow */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500 rounded-full animate-pulse opacity-100"></div>
        
        {/* Search Icon with spin and pulse */}
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <ScanSearch
            className=" animate-spin-slow animate-pulse" 
            size={58} 
            strokeWidth={1.5}
          />
        </div>
      </div>
      <span className="text-cyan-500 font-semibold text-lg text-center">
        {loadingText}{dots}
      </span>
    </div>
  );
};

export default Spinner;
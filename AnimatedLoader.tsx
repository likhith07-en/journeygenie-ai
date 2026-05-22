import React, { useEffect, useState } from 'react';

export const AnimatedLoader: React.FC<{ message?: string }> = ({ message = "Crafting your masterpiece..." }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-[999]">
      <div className="relative w-64 h-32 flex items-center justify-center">
        {/* Animated Path */}
        <svg className="absolute w-full h-full" viewBox="0 0 200 100">
          <path
            d="M 20 80 Q 100 0 180 80"
            fill="transparent"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeDasharray="5,5"
            className="animate-[dash_2s_linear_infinite]"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Moving Plane */}
        <div className="absolute w-full h-full flex items-center justify-center animate-[fly_3s_ease-in-out_infinite]">
          <span className="text-4xl filter drop-shadow-lg transform -rotate-12">✈️</span>
        </div>

        {/* Map Markers */}
        <div className="absolute left-[10%] bottom-[10%] animate-bounce delay-100">
          <span className="text-2xl filter drop-shadow-md">📍</span>
        </div>
        <div className="absolute right-[10%] bottom-[10%] animate-bounce delay-300">
          <span className="text-2xl filter drop-shadow-md">🏖️</span>
        </div>
      </div>

      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-8 animate-pulse">
        {message}{dots}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
        Our AI is optimizing your route and finding the best spots...
      </p>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        @keyframes fly {
          0% {
            transform: translateX(-80px) translateY(20px) rotate(-15deg) scale(0.8);
          }
          50% {
            transform: translateX(0px) translateY(-20px) rotate(0deg) scale(1.1);
          }
          100% {
            transform: translateX(80px) translateY(20px) rotate(15deg) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};

import React from 'react';

interface CreatorFooterProps {
  className?: string;
}

const CreatorFooter: React.FC<CreatorFooterProps> = ({ className = '' }) => {
  return (
    <div className={`border-t border-gray-100 p-3 bg-gradient-to-r from-gray-900 to-black text-center relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(51,51,51,0.3),transparent_70%)]"></div>
      <p className="text-gray-400 text-xs font-light tracking-widest relative z-10 flex items-center justify-center gap-2">
        <span className="inline-block bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">CREATED BY</span>
        <a 
          href="https://www.linkedin.com/in/dakshinsiva/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white hover:text-blue-400 transition-colors duration-300 font-medium"
        >
          DAKSHIN RAJ SIVA
        </a>
        <span className="animate-pulse text-blue-400">•</span>
      </p>
    </div>
  );
};

export default CreatorFooter; 
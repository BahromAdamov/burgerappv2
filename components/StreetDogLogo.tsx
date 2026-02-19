
import React from 'react';

export const StreetDogLogo: React.FC<{ className?: string, iconColor?: string, textColor?: string }> = ({ 
  className = "h-8", 
  iconColor = "white", 
  textColor = "black" 
}) => (
  <svg 
    viewBox="0 0 225 72" 
    className={`${className} overflow-visible`} 
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Street Dog Logo"
  >
    <defs>
      <filter id="logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
         <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.15)" />
      </filter>
    </defs>
    
    {/* Stylized Icon (Long Burger) */}
    <g filter="url(#logo-shadow)">
      {/* Top Bun */}
      <rect x="2" y="10" width="80" height="12" rx="6" fill={iconColor} />
      
      {/* Middle Patty (Thinner and wider) */}
      <rect x="2" y="28" width="80" height="16" rx="6" fill={iconColor} />
      
      {/* Bottom Bun */}
      <rect x="2" y="50" width="80" height="12" rx="6" fill={iconColor} />
    </g>

    {/* Text */}
    <g fill={textColor} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <text x="94" y="34" fontWeight="900" fontSize="36" letterSpacing="-1">STREET</text>
      <text x="94" y="65" fontWeight="900" fontSize="36" letterSpacing="-1">DOG</text>
    </g>
  </svg>
);

import React from 'react';

const STREET_DOG_LOGO_URL = 'https://lh3.googleusercontent.com/d/1GEU07jxJjtkeL4W4l_945hUqJDfv-049';

export const StreetDogLogo: React.FC<{ className?: string; iconColor?: string; textColor?: string }> = ({
  className = 'h-8'
}) => (
  <img
    src={STREET_DOG_LOGO_URL}
    alt="Street Dog Logo"
    className={className}
    referrerPolicy="no-referrer"
    loading="eager"
  />
);

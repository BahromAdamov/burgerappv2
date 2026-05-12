
import React, { useState } from 'react';
import { Burger } from '../types';
import { Plus, Flame, Star, Coffee, UtensilsCrossed, ImageOff } from 'lucide-react';
import { BRAND_ORANGE } from '../constants';
import { useI18n } from '../i18n';

interface BurgerCardProps {
  burger: Burger;
  onAddToCart: (burger: Burger) => void;
  onClick: (burger: Burger) => void;
}

const BurgerCard: React.FC<BurgerCardProps> = ({ burger, onAddToCart, onClick }) => {
  const { t } = useI18n();
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const getIcon = () => {
    switch (burger.category) {
      case 'Burgers': return <UtensilsCrossed className="w-2.5 h-2.5" style={{ color: BRAND_ORANGE }} />;
      case 'Hot Dogs': return <Flame className="w-2.5 h-2.5 text-red-500" />;
      case 'Drinks': return <Coffee className="w-2.5 h-2.5 text-blue-500" />;
      default: return <Star className="w-2.5 h-2.5 text-orange-500" />;
    }
  };

  const displayPrice = burger.options && burger.options.length > 0 
    ? Math.min(...burger.options.map(o => o.price)) 
    : burger.price;

  const hasImage = burger.images && burger.images.length > 0 && burger.images[0];

  return (
    <div 
      onClick={() => onClick(burger)}
      className="group bg-white rounded-[1.8rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full transition-all active:scale-[0.97] hover:shadow-md duration-300"
    >
      <div className="relative h-28 overflow-hidden bg-white">
        {imgLoading && !imgError && hasImage && (
          <div className="absolute inset-0 bg-white animate-pulse flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-gray-50" />
          </div>
        )}
        
        {imgError || !hasImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white text-gray-200">
            <ImageOff className="w-6 h-6 mb-1" />
            <span className="text-[7px] font-black uppercase text-gray-300">{t('noPhoto')}</span>
          </div>
        ) : (
          <img 
            src={burger.images[0]} 
            alt={burger.name} 
            referrerPolicy="no-referrer"
            onLoad={() => setImgLoading(false)}
            onError={() => { setImgError(true); setImgLoading(false); }}
            className={`w-full h-full object-contain p-2 transition-all duration-500 ${imgLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-110'}`}
          />
        )}
        
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm border border-white/50">
          {getIcon()}
          <span className="text-[8px] font-black uppercase tracking-tight text-gray-800">{burger.category}</span>
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {burger.isHot && (
            <div className="bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-lg uppercase">HOT</div>
          )}
          {burger.isNew && (
            <div className="text-black text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-lg uppercase tracking-tighter" style={{ backgroundColor: BRAND_ORANGE }}>NEW</div>
          )}
        </div>
      </div>
      
      <div className="p-3 flex flex-col flex-grow bg-white">
        <h3 className="font-black text-gray-900 text-[11px] leading-tight mb-0.5 line-clamp-1 uppercase italic tracking-tight">{burger.name}</h3>
        <p className="text-[9px] text-gray-400 line-clamp-1 mb-2 flex-grow leading-snug font-medium italic opacity-80">{burger.description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="font-black text-black text-[13px] tracking-tighter">
              {displayPrice.toLocaleString()} 
              <span className="text-[8px] text-gray-300 ml-0.5 font-bold">{t('sum').toUpperCase()}</span>
            </span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(burger); }}
            className="text-black p-2 rounded-xl transition-all shadow-md active:scale-90 hover:brightness-110"
            style={{ backgroundColor: BRAND_ORANGE }}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BurgerCard;

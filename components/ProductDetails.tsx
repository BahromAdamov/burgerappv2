
import React, { useState, useRef } from 'react';
import { Burger, ProductOption } from '../types';
import { X, Flame, ShoppingCart, ImageOff } from 'lucide-react';
import { safeHaptic } from '../utils';

interface ProductDetailsProps {
  product: Burger;
  onClose: () => void;
  onAddToCart: (product: Burger, option?: ProductOption) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onClose, onAddToCart }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<ProductOption | undefined>(
    product.options && product.options.length > 0 ? product.options[0] : undefined
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const images = product.images.length > 0 ? product.images : [];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      if (index !== currentImgIndex) setCurrentImgIndex(index);
    }
  };

  const currentPrice = selectedOption ? selectedOption.price : product.price;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in slide-in-from-bottom duration-500 overflow-y-auto no-scrollbar">
      
      {/* Шапка с кнопкой закрытия */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none">
        <button 
          onClick={onClose} 
          className="pointer-events-auto bg-white/90 backdrop-blur-xl p-3.5 rounded-2xl text-black shadow-2xl active:scale-90 transition-all border border-gray-100/50"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Липкая область с фотографией */}
      <div className="sticky top-0 h-[75vh] w-full bg-white z-0">
        {images.length > 0 ? (
          <>
            <div 
              ref={scrollRef} 
              onScroll={handleScroll} 
              className="flex flex-row w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar relative z-10"
            >
              {images.map((img, idx) => (
                <div key={idx} className="min-w-full h-full snap-center flex items-center justify-center p-4">
                  <img 
                    src={img} 
                    className="w-full h-full object-contain transition-transform duration-700 hover:scale-105" 
                    alt={product.name} 
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex gap-2 px-3 py-1.5 bg-black/5 backdrop-blur-md rounded-full border border-black/5">
                {images.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentImgIndex ? 'bg-[#FF7A00] w-6' : 'bg-black/10 w-1'}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-100">
            <ImageOff className="w-24 h-24 opacity-20" />
          </div>
        )}
        
        {/* Плавный переход от фото к тексту */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
      </div>

      {/* Контентная область (Лист) */}
      <div className="relative z-30 bg-white px-8 pb-12 rounded-t-[3.5rem] -mt-20 shadow-[0_-30px_60px_rgba(0,0,0,0.12)] border-t border-gray-50 flex flex-col min-h-[50vh]">
        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto my-6 shrink-0" />
        
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-orange-50 text-[#FF7800] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-orange-100/50">{product.category}</span>
              {product.isHot && <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm"><Flame className="w-3 h-3 fill-current"/> HOT</span>}
            </div>
            <h2 className="text-3xl font-black text-black tracking-tighter italic uppercase leading-[0.85]">{product.name}</h2>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[9px] uppercase font-black text-gray-300 tracking-[0.2em] mb-1">К оплате</span>
            <p className="text-2xl font-black text-black leading-tight tracking-tighter italic">
              {currentPrice.toLocaleString()} 
              <span className="text-[10px] uppercase font-bold text-gray-400 ml-1">сум</span>
            </p>
          </div>
        </div>

        <div className="space-y-10 mb-8">
          {product.options && product.options.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">Размер заказа</h4>
              <div className="flex flex-wrap gap-2.5">
                {product.options.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => { setSelectedOption(opt); safeHaptic('light'); }}
                    className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${
                      selectedOption?.name === opt.name 
                        ? 'bg-black text-[#FF7800] border-black shadow-xl scale-105 active:scale-100' 
                        : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'
                    }`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">Описание</h4>
            <p className="text-gray-500 text-[14px] leading-relaxed font-semibold italic opacity-80">
              {product.description}
            </p>
          </section>
        </div>

        <button 
          onClick={() => { onAddToCart(product, selectedOption); onClose(); }}
          className="w-full bg-black text-[#FF7800] py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl hover:brightness-110 sticky bottom-0"
        >
          <ShoppingCart className="w-6 h-6" />
          Добавить • {currentPrice.toLocaleString()} сум
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;

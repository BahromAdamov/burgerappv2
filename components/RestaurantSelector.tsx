
import React from 'react';
import { MapPin, ChevronRight, Phone, CheckCircle2 } from 'lucide-react';
import { StreetDogLogo } from './StreetDogLogo';
import { BRAND_ORANGE } from '../constants';
import { Restaurant } from '../App';

interface RestaurantSelectorProps {
  currentId?: string;
  onSelect: (restaurant: Restaurant) => void;
}

// ВАЖНО: ID филиалов (branch_1, branch_2) должны совпадать с ключами в Google Apps Script
export const LOCATIONS: Restaurant[] = [
  {
    id: 'branch_1',
    name: 'STREET DOG (Центр)',
    address: 'ул. Аль-Хоразмий 71',
    phone: '+998 91 996-40-40',
    image: 'https://drive.google.com/file/d/11c-opaIbkiZr5nHVwhKf5aom6ukwheT6/view?usp=sharing' // Placeholder, will be replaced
  },
  {
    id: 'branch_2',
    name: 'STREET DOG (Филиал 2)',
    address: 'ул. Хонка 175',
    phone: '+998 97 288-40-40',
    image: 'https://drive.google.com/file/d/1yYOByyDC0z5rnsOYNBC-8HxFaBNvYk2x/view?usp=sharing' // Placeholder, will be replaced
  }
];

const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({ currentId, onSelect }) => {
  return (
    <div className="fixed inset-0 z-[90] bg-white flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div className="p-6 pt-6 rounded-b-[3rem] shadow-xl text-center relative z-10" style={{ backgroundColor: BRAND_ORANGE }}>
        <StreetDogLogo className="h-12 mx-auto drop-shadow-lg mb-3" iconColor="white" textColor="black" />
        <h2 className="text-xl font-black text-black uppercase italic tracking-tighter mb-0.5">Где заказываем?</h2>
        <p className="text-[9px] font-black text-black/60 uppercase tracking-widest">Выберите ближайший филиал</p>
      </div>

      <div className="flex-grow p-5 flex flex-col gap-3 justify-center max-w-md mx-auto w-full overflow-y-auto no-scrollbar">
        {LOCATIONS.map((loc) => {
          const isSelected = loc.id === currentId;
          return (
            <button
              key={loc.id}
              onClick={() => onSelect(loc)}
              className={`group relative w-full bg-white border-2 p-4 rounded-[1.8rem] flex flex-col text-left gap-3 shadow-sm active:scale-95 transition-all duration-300 ${
                isSelected ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-orange-200 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <div className={`p-2.5 rounded-xl transition-colors ${isSelected ? 'bg-black text-white' : 'bg-orange-50 text-[#FF7800]'}`}>
                  <MapPin className="w-5 h-5" />
                </div>
                {isSelected && (
                  <div className="bg-black text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span className="text-[7px] font-black uppercase tracking-widest">Выбрано</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {loc.image && (
                  <img 
                    src={loc.image} 
                    alt={loc.name} 
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="space-y-0.5 flex-1">
                  <h3 className="text-base font-black text-gray-900 uppercase italic tracking-tight">{loc.name}</h3>
                  <p className="text-[10px] font-medium text-gray-400 leading-tight line-clamp-1">{loc.address}</p>
                  {loc.phone && (
                    <div className="flex items-center gap-1 mt-1 text-gray-500 bg-gray-50 w-fit px-2 py-0.5 rounded-lg border border-gray-100">
                      <Phone className="w-2.5 h-2.5 text-[#FF7800]" />
                      <span className="text-[9px] font-bold">{loc.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end mt-1 pt-3 border-t border-gray-100 w-full">
                <div className={`p-1.5 rounded-full transition-all ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-300'}`}>
                   <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-6 text-center bg-white border-t border-gray-50 shrink-0">
        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.2em]">Street Dog Xorazm • 2025</p>
      </div>
    </div>
  );
};

export default RestaurantSelector;

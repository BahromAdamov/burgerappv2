
import React, { useState } from 'react';
import { Truck, Store, ChevronRight, MapPin, Package, ArrowLeft, CheckCircle2, Loader2, MessageSquare, Compass } from 'lucide-react';
import { StreetDogLogo } from './StreetDogLogo';
import { safeShowAlert, safeHaptic } from '../utils';
import { BRAND_ORANGE } from '../constants';

interface OrderTypeSelectorProps {
  onSelect: (type: 'pickup' | 'delivery', address?: string) => void;
}

const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({ onSelect }) => {
  const [view, setView] = useState<'selection' | 'address'>('selection');
  const [address, setAddress] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [deliveryComment, setDeliveryComment] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleDeliveryClick = () => {
    setView('address');
    safeHaptic('light');
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    safeHaptic('medium');

    if (!navigator.geolocation) {
      safeShowAlert("Геолокация не поддерживается вашим устройством.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Nominatim reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, {
            headers: { 'Accept-Language': 'ru' }
          });
          const data = await response.json();
          
          if (data && data.address) {
            const parts = data.address;
            const shortAddress = [
              parts.road || parts.pedestrian || parts.suburb || parts.city_district || parts.village,
              parts.house_number
            ].filter(Boolean).join(', ');
            
            setAddress(shortAddress || data.display_name);
            safeHaptic('success');
          } else {
            setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            safeShowAlert("Адрес определен в виде координат.");
          }
        } catch {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        safeShowAlert("Не удалось получить доступ к GPS. Введите адрес вручную.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirmDelivery = () => {
    const finalAddressParts = [];
    if (address) finalAddressParts.push(address.trim());
    if (flatNumber) finalAddressParts.push(`кв. ${flatNumber}`);
    if (deliveryComment) finalAddressParts.push(`(${deliveryComment})`);
    
    const fullAddress = finalAddressParts.join(', ');
    if (address.trim().length >= 3) {
      onSelect('delivery', fullAddress);
    } else {
      safeShowAlert("Введите корректный адрес");
    }
  };

  return (
    <div className="fixed inset-0 z-[85] bg-white flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div className="p-6 pt-6 rounded-b-3xl shadow-lg text-center shrink-0" style={{ backgroundColor: BRAND_ORANGE }}>
        <StreetDogLogo className="h-10 mx-auto drop-shadow-md mb-3" iconColor="white" textColor="black" />
        <h2 className="text-xl font-black text-black uppercase italic tracking-tighter mb-0.5 leading-none">
          {view === 'selection' ? 'Как заберёте?' : 'Адрес доставки'}
        </h2>
        <p className="text-[9px] font-black text-black/60 uppercase tracking-widest italic opacity-80">
          {view === 'selection' ? 'Способ получения' : 'Куда привезти заказ?'}
        </p>
      </div>

      <div className="flex-grow p-6 flex flex-col gap-4 justify-start max-w-md mx-auto w-full overflow-y-auto no-scrollbar">
        {view === 'selection' ? (
          <div className="flex flex-col gap-5 justify-center h-full animate-in zoom-in-95 duration-300">
            <button
              onClick={() => onSelect('pickup')}
              className="group relative bg-white border-2 border-gray-100 p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm active:scale-95 active:border-[#FF7800] transition-all"
            >
              <div className="p-4 bg-orange-50 rounded-[1.5rem] group-active:bg-[#FF7800] transition-colors shrink-0">
                <Store className="w-8 h-8 text-[#FF7800] group-active:text-white" />
              </div>
              <div className="flex-grow text-left">
                <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Самовывоз</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Из кафе</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-200" />
            </button>

            <button
              onClick={handleDeliveryClick}
              className="group relative bg-white border-2 border-gray-100 p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm active:scale-95 active:border-[#FF7800] transition-all"
            >
              <div className="p-4 bg-black rounded-[1.5rem] shrink-0">
                <Truck className="w-8 h-8 text-[#FF7800]" />
              </div>
              <div className="flex-grow text-left">
                <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Доставка</h3>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider leading-tight">Доставка в радиусе 5км 10.000</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-200" />
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-300 py-2">
            <div className="space-y-3">
              <div className="relative group">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] ml-4 mb-1 block">Улица и дом</label>
                <div className="relative mb-3">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF7800]" />
                  <input
                    autoFocus
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ваш адрес..."
                    className="w-full bg-gray-50 rounded-[2rem] py-5 pl-12 pr-4 text-sm font-bold border-2 border-transparent focus:border-[#FF7800] outline-none shadow-inner transition-all focus:bg-white"
                  />
                </div>

                <button 
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="w-full py-4 bg-black text-[#FF7800] rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                  Найти меня
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest ml-4 block">Кв / Офис</label>
                <input
                  type="text"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  placeholder="№"
                  className="w-full bg-gray-50 rounded-xl py-4 px-5 text-sm font-bold border-2 border-transparent focus:border-[#FF7800] outline-none shadow-inner transition-all focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest ml-4 block">Комментарий</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                  <input
                    type="text"
                    value={deliveryComment}
                    onChange={(e) => setDeliveryComment(e.target.value)}
                    placeholder="Ориентиры, подъезд..."
                    className="w-full bg-gray-50 rounded-xl py-4 pl-10 pr-4 text-sm font-bold border-2 border-transparent focus:border-[#FF7800] outline-none shadow-inner transition-all focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => { setView('selection'); safeHaptic('light'); }}
                className="w-1/4 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={address.trim().length < 3 || isLocating}
                onClick={handleConfirmDelivery}
                className="flex-grow bg-black text-[#FF7800] py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
              >
                Подтвердить <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 text-center space-y-3 shrink-0 bg-white border-t border-gray-50">
        <div className="flex items-center justify-center gap-3 opacity-20">
          <Package className="w-4 h-4" />
          <div className="h-px w-8 bg-black" />
          <MapPin className="w-4 h-4" />
        </div>
        <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">Street Dog Xorazm • 2025</p>
      </div>
    </div>
  );
};

export default OrderTypeSelector;

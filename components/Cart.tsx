
import React from 'react';
import { CartItem } from '../types';
import { ShoppingBag, Minus, Plus, Trash2, User, Phone, Store, MapPin, Truck, ChevronRight, MessageSquareText } from 'lucide-react';
import { BRAND_ORANGE } from '../constants';
import { safeHaptic } from '../utils';
import { Restaurant } from '../App';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number, optionName?: string) => void;
  selectedRestaurant: Restaurant | null;
  customerData: {
    name: string;
    phone: string;
    address: string;
    orderType: 'pickup' | 'delivery';
  };
  onCustomerDataChange: (f: string, v: string) => void;
  comment: string;
  onCommentChange: (v: string) => void;
  onCheckout: () => void;
  isSending: boolean;
}

const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, customerData, selectedRestaurant, onCustomerDataChange, comment, onCommentChange, onCheckout, isSending }) => {
  const total = items.reduce((sum, item) => {
    const price = item.selectedOption ? item.selectedOption.price : item.price;
    return sum + price * item.quantity;
  }, 0);

  if (items.length === 0) return (
    <div className="py-32 flex flex-col items-center text-gray-300 animate-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm border border-gray-100">
        <ShoppingBag className="w-10 h-10 text-gray-200" />
      </div>
      <p className="font-black uppercase text-[10px] tracking-[0.3em] text-gray-400">Корзина пуста</p>
      <p className="text-[9px] font-bold mt-2 text-gray-300 uppercase tracking-widest text-center px-10">Пора добавить что-нибудь вкусное!</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
         <h2 className="text-xl font-black uppercase italic tracking-tighter">Ваш заказ</h2>
         <div className="bg-white px-4 py-1.5 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-black text-[10px] font-black uppercase tracking-wider">{items.length} ПОЗИЦИИ</span>
         </div>
      </div>

      <div className="space-y-3">
        {items.map((i, idx) => {
          const itemPrice = i.selectedOption ? i.selectedOption.price : i.price;
          return (
            <div key={`${i.id}-${i.selectedOption?.name || idx}`} className="bg-white p-3 rounded-[2rem] flex items-center gap-4 shadow-sm border border-gray-100 transition-all">
              <div className="shrink-0 bg-gray-50 rounded-2xl p-1 border border-gray-100">
                 <img src={i.images[0]} className="w-16 h-16 object-contain" alt={i.name} />
              </div>
              
              <div className="flex-grow min-w-0">
                <h4 className="font-black text-xs uppercase truncate mb-0.5">{i.name}</h4>
                {i.selectedOption && (
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{i.selectedOption.name}</p>
                )}
                <p className="font-black text-sm text-[#FF7A00]">{(itemPrice * i.quantity).toLocaleString()} <span className="text-[9px]">сум</span></p>
              </div>

              <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100/50">
                <button 
                  onClick={() => { onUpdateQuantity(i.id, -1, i.selectedOption?.name); safeHaptic('light'); }} 
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm active:scale-90 transition-all border border-gray-100"
                >
                  {i.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                </button>
                
                <div className="w-7 text-center">
                  <span className="font-black text-xs">{i.quantity}</span>
                </div>

                <button 
                  onClick={() => { onUpdateQuantity(i.id, 1, i.selectedOption?.name); safeHaptic('light'); }} 
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm active:scale-90 transition-all border border-gray-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Инфо о способе получения и филиале */}
      <div className="bg-zinc-900 p-4 rounded-3xl flex items-center justify-between border border-white/5 shadow-xl animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
            {customerData.orderType === 'delivery' ? (
              <Truck className="w-5 h-5 text-[#FF7A00]" />
            ) : (
              <Store className="w-5 h-5 text-[#FF7A00]" />
            )}
          </div>
          <div>
              <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-0.5">
                {customerData.orderType === 'delivery' ? 'Доставка из кафе' : 'Заберу из кафе'}
              </p>
              <h4 className="text-white font-black text-[11px] uppercase tracking-tight">
                {selectedRestaurant?.name || 'Street Dog'}
              </h4>
          </div>
        </div>
        <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
           <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
             {customerData.orderType === 'delivery' ? 'КУРЬЕР' : 'САМОВЫВОЗ'}
           </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 mb-2">
           <div className="h-1 w-4 bg-[#FF7A00] rounded-full" />
           <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Контактные данные</h4>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input 
              type="text" 
              placeholder="Как вас зовут?" 
              value={customerData.name} 
              onChange={e => onCustomerDataChange('name', e.target.value)} 
              className="w-full bg-gray-50 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold outline-none border border-transparent focus:border-orange-50 focus:bg-white transition-all" 
            />
          </div>
          
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input 
              type="tel" 
              placeholder="Ваш номер" 
              value={customerData.phone} 
              onChange={e => onCustomerDataChange('phone', e.target.value)} 
              className="w-full bg-gray-50 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold outline-none border border-transparent focus:border-orange-50 focus:bg-white transition-all" 
            />
          </div>

          {customerData.orderType === 'delivery' && (
            <div className="relative group animate-in slide-in-from-top-2 duration-300">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input 
                type="text" 
                placeholder="Куда доставить?" 
                value={customerData.address} 
                onChange={e => onCustomerDataChange('address', e.target.value)} 
                className="w-full bg-gray-50 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold outline-none border border-transparent focus:border-orange-50 focus:bg-white transition-all" 
              />
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2">
            <MessageSquareText className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Комментарий к заказу</span>
          </div>
          <textarea 
            placeholder="Ориентир, пожелания..." 
            value={comment} 
            onChange={e => onCommentChange(e.target.value)} 
            className="w-full bg-gray-50 rounded-xl p-4 text-[11px] font-medium outline-none min-h-[100px] border border-transparent focus:border-orange-50 transition-all" 
          />
        </div>
      </div>

      <div className="bg-black text-white p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="space-y-2 mb-8 relative z-10">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
            <span>К оплате</span>
            <span>{total.toLocaleString()} сум</span>
          </div>
          
          {customerData.orderType === 'delivery' && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40 animate-in fade-in duration-300">
              <span>Доставка</span>
              <span className="text-white">в радиусе 5км 10.000</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end relative z-10 border-t border-white/10 pt-6">
          <div className="flex flex-col">
            <span className="font-black uppercase tracking-[0.2em] text-[8px] text-gray-500 mb-2 leading-none">Итоговая стоимость</span>
            <span className="text-3xl font-black text-[#FF7A00] tracking-tighter leading-none">
              {total.toLocaleString()} <span className="text-[10px] uppercase font-bold text-gray-600 ml-1">сум</span>
            </span>
          </div>
          <div className="w-14 h-14 bg-[#FF7A00] text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,120,0,0.3)] active:scale-95 transition-all">
            <ChevronRight className="w-7 h-7" />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={isSending}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${isSending ? 'bg-gray-200 text-gray-400' : 'bg-black text-[#FF7A00] shadow-xl'}`}
      >
        {isSending ? 'Отправляем...' : `Заказать в Telegram • ${total.toLocaleString()} сум`}
      </button>
    </div>
  );
};

export default Cart;

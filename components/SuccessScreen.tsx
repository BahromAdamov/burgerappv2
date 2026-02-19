
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, Clock, Utensils, Check, X, Phone, Truck, ChefHat, Store, Package } from 'lucide-react';
import { StreetDogLogo } from './StreetDogLogo';
import { BRAND_ORANGE, BACKEND_API_URL } from '../constants';
import { safeHaptic } from '../utils';

interface SuccessScreenProps {
  orderId: string;
  onClose: () => void;
}

// Возможные статусы из Google Script
type BackendStatus = 'pending' | 'cooking' | 'ready_pickup' | 'ready_delivery' | 'on_way' | 'completed' | 'cancelled';

const SuccessScreen: React.FC<SuccessScreenProps> = ({ orderId, onClose }) => {
  const [status, setStatus] = useState<BackendStatus>('pending');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Запрашиваем статус через GET запрос к Google Apps Script
        const res = await fetch(`${BACKEND_API_URL}?orderId=${orderId}`);
        const data = await res.json();
        const currentStatus = data.status as BackendStatus;
        
        if (currentStatus && currentStatus !== status) {
          setStatus(currentStatus);
          if (currentStatus === 'completed') safeHaptic('success');
          else if (currentStatus === 'cancelled') safeHaptic('error');
          else if (currentStatus === 'on_way') safeHaptic('success');
          else safeHaptic('medium');
        }
      } catch (e) { 
        console.error("Status check failed", e); 
      }
    };

    // Проверяем сразу и каждые 5 сек
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId, status]);

  // Маппинг статусов в UI шаги
  const steps = [
    { id: 'pending', label: 'Ожидание', icon: <Clock className="w-5 h-5" /> },
    { id: 'cooking', label: 'Готовится', icon: <ChefHat className="w-5 h-5" /> },
    { id: 'ready', label: 'Упакован', icon: <Package className="w-5 h-5" /> },
    { id: 'way', label: 'Путь/Выдача', icon: <Truck className="w-5 h-5" /> },
    { id: 'completed', label: 'Завершен', icon: <Sparkles className="w-5 h-5" /> },
  ];

  // Определяем активный шаг на основе статуса
  const getCurrentStepIndex = () => {
    switch (status) {
      case 'pending': return 0;
      case 'cooking': return 1;
      case 'ready_pickup': 
      case 'ready_delivery': return 2; // Готов к выдаче/курьеру
      case 'on_way': return 3; // У курьера
      case 'completed': return 4;
      default: return 0;
    }
  };

  const currentIdx = getCurrentStepIndex();

  if (status === 'cancelled') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black uppercase italic mb-2 text-gray-900">Заказ отменен</h2>
        <p className="text-gray-400 text-xs mb-8 font-bold uppercase tracking-wide leading-relaxed">
          Администратор отменил заказ.<br/>Возможно, товара нет в наличии или ресторан закрыт.
        </p>
        <button onClick={onClose} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl">
          Вернуться в меню
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-700">
      <div className="p-10 pt-16 rounded-b-[4rem] text-center space-y-4 shadow-xl relative z-10" style={{ backgroundColor: BRAND_ORANGE }}>
        <StreetDogLogo className="w-32 h-20 text-white mx-auto drop-shadow-2xl mb-2" />
        <h1 className="text-3xl font-black text-black uppercase italic leading-none tracking-tighter">ЗАКАЗ {orderId.slice(-4)}</h1>
        <p className="text-[10px] font-black text-black/60 uppercase tracking-widest italic">Статус обновляется автоматически</p>
      </div>

      <div className="flex-grow p-8 flex flex-col justify-center max-w-sm mx-auto w-full overflow-y-auto no-scrollbar">
        <div className="space-y-8 relative">
          {/* Линия прогресса */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100 -z-10" />
          
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isActive = idx === currentIdx;
            
            return (
              <div key={step.id} className={`flex items-center gap-6 transition-all duration-500 ${isCompleted ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 border-2 ${
                  isActive ? 'bg-black border-black text-[#FF7800] scale-110' : 
                  isCompleted ? 'bg-[#FF7800] border-[#FF7800] text-black' : 
                  'bg-white border-gray-100 text-gray-300'
                }`}>
                  {isCompleted && !isActive ? <Check className="w-6 h-6" /> : step.icon}
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-wider ${isActive ? 'text-black' : 'text-gray-400'}`}>{step.label}</h3>
                  {isActive && <p className="text-[8px] font-bold text-[#FF7800] uppercase tracking-widest animate-pulse mt-1">Текущий этап</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-8 space-y-4 bg-white">
        <a href="tel:+998919964040" className="w-full bg-gray-50 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
           <Phone className="w-4 h-4 text-[#FF7800]" /> Позвонить нам
        </a>
        
        {status === 'completed' && (
          <button onClick={onClose} className="w-full bg-black text-[#FF7800] py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all">
             Сделать новый заказ
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessScreen;

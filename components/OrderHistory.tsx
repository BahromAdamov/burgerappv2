
import React, { useEffect, useState } from 'react';
import { BACKEND_API_URL, BRAND_ORANGE } from '../constants';
import { Clock, ChevronRight, Package, MapPin, CheckCircle2, History, RefreshCw, AlertCircle } from 'lucide-react';

interface HistoryOrder {
  date: string;
  orderId: string;
  status: string;
  branch: string;
  type: string;
  total: number;
  items: string;
  comment: string;
}

interface OrderHistoryProps {
  phone: string;
}

const statusMap: Record<string, { label: string, color: string }> = {
  'pending': { label: 'Ожидает', color: '#9CA3AF' },
  'cooking': { label: 'Готовится', color: '#FF7800' },
  'ready_pickup': { label: 'Готов!', color: '#10B981' },
  'ready_delivery': { label: 'Упакован', color: '#10B981' },
  'on_way': { label: 'В пути', color: '#3B82F6' },
  'completed': { label: 'Завершен', color: '#10B981' },
  'cancelled': { label: 'Отменен', color: '#EF4444' }
};

const OrderHistory: React.FC<OrderHistoryProps> = ({ phone }) => {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    // Защита от пустого запроса
    if (!phone || phone.length < 5) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_API_URL}?historyPhone=${encodeURIComponent(phone)}`);
      
      if (!res.ok) throw new Error("Server error");
      
      const text = await res.text();
      // Если вернулся HTML (ошибка скрипта)
      if (text.trim().startsWith('<')) {
        throw new Error("Script error");
      }

      const data = JSON.parse(text);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("History fetch error:", e);
      setError("Не удалось загрузить историю");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [phone]);

  if (loading) return (
    <div className="py-24 flex flex-col items-center text-gray-300">
      <RefreshCw className="w-10 h-10 animate-spin mb-4 text-[#FF7800]" />
      <span className="text-[11px] font-black uppercase tracking-widest">Загружаем историю...</span>
    </div>
  );

  if (error) return (
    <div className="py-32 flex flex-col items-center text-gray-300 px-10 text-center">
      <AlertCircle className="w-8 h-8 text-red-300 mb-3" />
      <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Ошибка связи</p>
      <button onClick={fetchHistory} className="mt-4 px-4 py-2 bg-gray-100 rounded-xl text-[9px] font-black uppercase">Попробовать снова</button>
    </div>
  );

  if (orders.length === 0) return (
    <div className="py-32 flex flex-col items-center text-gray-300 px-10 text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 border border-gray-100">
        <History className="w-8 h-8 text-gray-200" />
      </div>
      <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Заказов пока нет</p>
      <p className="text-[9px] font-bold mt-2 text-gray-300 uppercase leading-relaxed">Как только вы сделаете первый заказ, он появится здесь</p>
    </div>
  );

  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1 mb-2">
         <h2 className="text-xl font-black uppercase italic tracking-tighter">История заказов</h2>
         <button onClick={fetchHistory} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <RefreshCw className="w-4 h-4 text-gray-400" />
         </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const statusInfo = statusMap[order.status] || { label: order.status, color: '#000' };
          let dateStr = '', timeStr = '';
          try {
             const dateObj = new Date(order.date);
             dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
             timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          } catch(e) {}

          return (
            <div key={order.orderId} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${statusInfo.color}15` }}>
                    <Package className="w-5 h-5" style={{ color: statusInfo.color }} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-tight">ЗАКАЗ {order.orderId.slice(-4)}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{dateStr}, {timeStr}</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest" style={{ borderColor: statusInfo.color, color: statusInfo.color }}>
                   {statusInfo.label}
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-gray-500 italic leading-snug">
                  {order.items ? order.items.split('\n').map((item, i) => (
                    <span key={i} className="block">• {item}</span>
                  )) : 'Нет данных'}
                </p>
                <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-300" />
                    <span className="text-[8px] font-black uppercase text-gray-400 truncate max-w-[120px]">{order.branch}</span>
                  </div>
                  <span className="text-xs font-black text-black">{order.total ? order.total.toLocaleString() : 0} сум</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistory;


import React, { useEffect, useState, useCallback } from 'react';
import { BACKEND_API_URL } from '../constants';
import { Package, MapPin, History, RefreshCw, AlertCircle } from 'lucide-react';
import { safeHaptic } from '../utils';

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

  const fetchHistory = useCallback(async () => {
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
  }, [phone]);

  useEffect(() => {
    fetchHistory();
  }, [phone, fetchHistory]);

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
      <button onClick={fetchHistory} className="mt-4 px-6 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg">Попробовать снова</button>
    </div>
  );

  if (orders.length === 0) return (
    <div className="py-32 flex flex-col items-center text-gray-300 px-10 text-center">
      <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm border border-gray-100">
        <History className="w-10 h-10 text-gray-100" />
      </div>
      <p className="font-black uppercase text-[11px] tracking-widest text-gray-400">Заказов пока нет</p>
      <p className="text-[9px] font-bold mt-2 text-gray-300 uppercase leading-relaxed max-w-[200px]">Как только вы сделаете первый заказ, он появится здесь</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
         <h2 className="text-2xl font-black uppercase tracking-tighter italic">История</h2>
         <button 
           onClick={() => { fetchHistory(); safeHaptic('medium'); }} 
           className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center active:scale-90 transition-all"
         >
            <RefreshCw className="w-4 h-4 text-gray-400" />
         </button>
      </div>

      <div className="space-y-5">
        {orders.map((order) => {
          const statusInfo = statusMap[order.status] || { label: order.status, color: '#000' };
          let dateStr = '', timeStr = '';
          try {
             const dateObj = new Date(order.date);
             dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
             timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          } catch {
            // ignore
          }

          return (
            <div key={order.orderId} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative" style={{ backgroundColor: `${statusInfo.color}10` }}>
                    <Package className="w-6 h-6" style={{ color: statusInfo.color }} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: statusInfo.color }} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight">ЗАКАЗ {order.orderId.slice(-4)}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dateStr} • {timeStr}</p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-colors" style={{ borderColor: `${statusInfo.color}30`, color: statusInfo.color, backgroundColor: `${statusInfo.color}05` }}>
                   {statusInfo.label}
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-[1.5rem] p-4 space-y-3">
                <div className="space-y-1">
                  {order.items ? order.items.split('\n').map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight leading-tight">{item}</span>
                    </div>
                  )) : <span className="text-[10px] font-bold text-gray-400 uppercase italic">Нет данных</span>}
                </div>
                
                <div className="pt-3 flex justify-between items-center border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-[9px] font-black uppercase text-gray-400 truncate max-w-[140px] tracking-wider">{order.branch}</span>
                  </div>
                  <span className="text-sm font-black text-black tracking-tight">{order.total ? order.total.toLocaleString() : 0} СУМ</span>
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

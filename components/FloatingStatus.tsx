
import React, { useEffect, useState } from 'react';
import { ChefHat, Package, Truck, Sparkles, X, RefreshCw, CheckCircle2, Phone, Ban, ChevronUp, ChevronDown } from 'lucide-react';
import { BACKEND_API_URL } from '../constants';
import { safeHaptic, safeShowAlert } from '../utils';
import { useI18n } from '../i18n';

interface FloatingStatusProps {
  orderId: string;
  onClose: () => void;
  orderType: 'pickup' | 'delivery' | null;
  restaurantPhone?: string;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

type BackendStatus = 'pending' | 'cooking' | 'ready_pickup' | 'on_way' | 'completed' | 'cancelled';

const FloatingStatus: React.FC<FloatingStatusProps> = ({ orderId, onClose, orderType, restaurantPhone, isMinimized, onToggleMinimize }) => {
  const { t } = useI18n();
  const [status, setStatus] = useState<BackendStatus>(() => {
    const saved = localStorage.getItem(`sd_status_${orderId}`);
    return (saved as BackendStatus) || 'pending';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      if (!orderId) return;
      try {
        const res = await fetch(`${BACKEND_API_URL}?orderId=${encodeURIComponent(orderId)}&t=${Date.now()}`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const rawStatus = data.status?.toString().trim().toLowerCase() || 'pending';

        if (isMounted && rawStatus && rawStatus !== 'not_found') {
          const currentStatus = rawStatus as BackendStatus;
          setStatus(prev => {
            const prevIdx = getStatusIndex(prev);
            const nextIdx = getStatusIndex(currentStatus);

            if (nextIdx < prevIdx && currentStatus !== 'cancelled' && prev !== 'cancelled') {
              return prev;
            }

            if (prev !== currentStatus) {
              localStorage.setItem(`sd_status_${orderId}`, currentStatus);
              if (currentStatus === 'completed') safeHaptic('success');
              else if (currentStatus === 'cancelled') safeHaptic('error');
              else safeHaptic('medium');
              return currentStatus;
            }
            return prev;
          });
        }
        if (isMounted) setLoading(false);
      } catch (e: any) {
        if (e?.message !== 'Load failed') {
          console.warn("Status check issue:", e?.message);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  useEffect(() => {
    if (status === 'completed' || status === 'cancelled') {
      const timer = setTimeout(() => {
        localStorage.removeItem(`sd_status_${orderId}`);
        onClose();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [status, orderId, onClose]);

  const steps = orderType === 'delivery'
    ? [
        { id: 'pending', label: t('accepted'), icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        { id: 'cooking', label: t('cooking'), icon: <ChefHat className="w-3.5 h-3.5" /> },
        { id: 'on_way', label: t('onWay'), icon: <Truck className="w-3.5 h-3.5" /> }
      ]
    : [
        { id: 'pending', label: t('accepted'), icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        { id: 'cooking', label: t('cooking'), icon: <ChefHat className="w-3.5 h-3.5" /> },
        { id: 'ready_pickup', label: t('ready'), icon: <Package className="w-3.5 h-3.5" /> }
      ];

  const getStatusIndex = (s: string) => {
    const normalized = s.toLowerCase().trim();
    if (normalized === 'pending') return 0;
    if (normalized === 'cooking') return 1;
    if (normalized === 'ready_pickup' || normalized === 'on_way' || normalized === 'ready') return 2;
    if (normalized === 'completed') return 3;
    return 0;
  };

  const currentIdx = getStatusIndex(status);

  const handleCall = () => {
    const phone = (restaurantPhone || '+998919964040').replace(/[^\d+]/g, '');
    const telUrl = `tel:${phone}`;

    // В Telegram WebApp лучше всего работает прямой переход по tel:
    // или использование openLink если это поддерживается для tel:
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.openLink) {
      try {
        tg.openLink(telUrl);
      } catch {
        window.location.href = telUrl;
      }
    } else {
      window.location.href = telUrl;
    }
    safeHaptic('medium');
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto h-0 overflow-visible pointer-events-none">
      {(status === 'completed' || status === 'cancelled') ? (
        <div className="relative pointer-events-auto">
          <div className="bg-black/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status === 'completed' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'}`}>
                {status === 'completed' ? <Sparkles className="w-7 h-7 text-black" /> : <Ban className="w-7 h-7 text-white" />}
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('order')} {orderId.slice(-4)}</p>
                <p className={`text-sm font-black uppercase tracking-wider ${status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                  {status === 'completed' ? t('completed') : t('cancelled')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(`sd_status_${orderId}`);
                onClose();
                safeHaptic('light');
              }}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      ) : isMinimized ? (
        <div className="flex justify-center relative pointer-events-auto">
          <div
            onClick={() => { onToggleMinimize(); safeHaptic('light'); }}
            className="bg-black/95 backdrop-blur-2xl border border-white/10 p-1.5 shadow-2xl flex items-center gap-3 rounded-full cursor-pointer hover:bg-black transition-all group"
          >
            <div className="flex items-center gap-1.5 pl-2">
              {steps.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                return (
                  <div
                    key={step.id}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isCompleted ? 'bg-[#FF7800]' :
                      isActive ? 'bg-[#FF7800] shadow-[0_0_12px_rgba(255,120,0,0.6)]' :
                      'bg-white/5'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-black" /> : (
                      <div className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-white/20'}`}>
                        {step.icon}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="pr-3 flex items-center gap-2">
              <span className="text-[10px] font-black text-white uppercase tracking-wider">
                {steps[currentIdx]?.label || t('processing')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#FF7800] group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-sm mx-auto relative pointer-events-auto">
          <div className="bg-black/95 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-6 shadow-2xl flex flex-col gap-6 overflow-hidden relative">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF7800]/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF7800] animate-ping absolute inset-0" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF7800] relative" />
                </div>
                <span className="text-[11px] font-black text-white uppercase tracking-[0.25em]">{t('order')} {orderId.slice(-4)}</span>
              </div>
              <div className="flex items-center gap-3">
                {loading && <RefreshCw className="w-3.5 h-3.5 text-white/20 animate-spin" />}
                <button
                  onClick={() => { onToggleMinimize(); safeHaptic('light'); }}
                  className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
                >
                  <ChevronUp className="w-5 h-5 text-white/40" />
                </button>
              </div>
            </div>

            <div className="text-center py-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                {steps[currentIdx]?.label || t('processing')}
              </h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {status === 'pending' ? t('orderAcceptedSoon') :
                 status === 'cooking' ? t('chefsCooking') :
                 status === 'on_way' ? t('courierOnWay') :
                 status === 'ready_pickup' ? t('orderReadyWaiting') : t('followStatus')}
              </p>
            </div>

            <div className="flex justify-between relative px-4 py-2">
              <div className="absolute top-1/2 -translate-y-1/2 left-10 right-10 h-[3px] bg-white/5 rounded-full" />
              <div
                className="absolute top-1/2 -translate-y-1/2 left-10 right-10 h-[3px] bg-[#FF7800] origin-left rounded-full shadow-[0_0_10px_rgba(255,120,0,0.5)]"
                style={{ transform: `scaleX(${currentIdx / (steps.length - 1)})` }}
              />

              {steps.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                return (
                  <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                        isCompleted ? 'bg-[#FF7800] border-[#FF7800]' :
                        isActive ? 'bg-black border-[#FF7800] shadow-[0_0_20px_rgba(255,120,0,0.4)]' :
                        'bg-black border-white/10'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-black" /> : (
                        <div className={isActive ? 'text-[#FF7800]' : 'text-white/20'}>
                          {step.icon}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-2">
              <a
                href={`tel:${(restaurantPhone || '998919964040').replace(/\D/g, '')}`}
                target="_top"
                onClick={() => safeHaptic('medium')}
                className="flex-[2] bg-white/5 hover:bg-white/10 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 group border border-white/5 no-underline"
              >
                <Phone className="w-4 h-4 text-[#FF7800]" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('call')}</span>
              </a>
              <button
                onClick={() => {
                  safeShowAlert(t('cancelByPhone'));
                  safeHaptic('warning');
                }}
                className="flex-1 bg-red-500/5 hover:bg-red-500/10 py-4 rounded-[1.5rem] flex items-center justify-center transition-all active:scale-95 group border border-red-500/10"
              >
                <Ban className="w-4 h-4 text-red-500/40 group-hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingStatus;

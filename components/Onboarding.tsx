
import React, { useState } from 'react';
import { User, Phone, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { StreetDogLogo } from './StreetDogLogo';
import { BRAND_ORANGE } from '../constants';
import { safeHaptic } from '../utils';

interface OnboardingProps {
  onConfirm: (data: { name: string; phone: string; address: string }) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onConfirm }) => {
  const tg = window.Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user;
  
  const [data, setData] = useState({
    name: tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : '',
    phone: '',
    address: ''
  });

  const [view, setView] = useState<'welcome' | 'manual-name' | 'manual-phone' | 'verifying'>('welcome');
  const [error, setError] = useState<string | null>(null);

  const handleQuickLogin = () => {
    if (!tg) {
      setView('manual-name');
      return;
    }

    const isSupported = tg.isVersionAtLeast && tg.isVersionAtLeast('6.9');

    if (!isSupported) {
      setView('manual-name');
      return;
    }

    try {
      tg.requestContact((res: any) => {
        if (res.status === 'sent' && res.response && res.response.contact) {
          const contact = res.response.contact;
          const phone = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;
          const finalName = data.name || `${contact.first_name} ${contact.last_name || ''}`.trim();
          
          setData(prev => ({ ...prev, phone, name: finalName }));
          setView('verifying');
          safeHaptic('success');
          
          setTimeout(() => {
            onConfirm({ name: finalName, phone, address: '' });
          }, 800);
        } else {
          // If user cancels or error, go to manual
          setView('manual-name');
          safeHaptic('warning');
        }
      });
    } catch {
      setView('manual-name');
    }
  };

  const handleManualPhoneSubmit = () => {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      setError('Введите корректный номер');
      safeHaptic('error');
      return;
    }
    setView('verifying');
    safeHaptic('medium');
    setTimeout(() => {
      onConfirm({ ...data, address: '' });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-500 overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] flex flex-col items-center justify-start pt-16 rounded-b-[5rem] -z-10 shadow-2xl overflow-hidden" style={{ backgroundColor: BRAND_ORANGE }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
            <StreetDogLogo className="h-64" iconColor="white" textColor="white" />
        </div>
        <div className="flex flex-col items-center gap-4 animate-in slide-in-from-top-8 duration-700 relative z-10">
          <StreetDogLogo className="h-24" iconColor="white" textColor="black" />
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center px-8 text-center pt-32">
        <div className="w-full bg-white p-8 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] border border-gray-50 relative">
          
          {view === 'welcome' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
              <div className="space-y-2">
                <h2 className="text-xl font-black text-gray-900 uppercase italic">Добро пожаловать!</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Для заказа необходимо авторизоваться</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleQuickLogin}
                  className="w-full bg-black py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                  style={{ color: BRAND_ORANGE }}
                >
                  <Zap className="w-5 h-5 fill-current" />
                  БЫСТРЫЙ ВХОД
                </button>
                <button
                  onClick={() => { setView('manual-name'); safeHaptic('light'); }}
                  className="w-full bg-gray-50 text-gray-400 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:text-black transition-colors"
                >
                  Ввести вручную
                </button>
              </div>
            </div>
          )}

          {view === 'manual-name' && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <div className="text-left space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Как вас зовут?</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#FF7800] transition-colors" />
                  <input
                    autoFocus
                    type="text"
                    value={data.name}
                    onChange={(e) => { setData({ ...data, name: e.target.value }); setError(null); }}
                    placeholder="Ваше имя..."
                    className="w-full bg-gray-50 rounded-2xl py-5 pl-14 pr-4 text-sm font-bold border-2 border-transparent focus:border-[#FF7800] outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
              <button
                disabled={data.name.trim().length < 2}
                onClick={() => { setView('manual-phone'); safeHaptic('light'); }}
                className="w-full bg-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                style={{ color: BRAND_ORANGE }}
              >
                ПРОДОЛЖИТЬ <ArrowRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          )}

          {view === 'manual-phone' && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <div className="text-left space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Ваш номер</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#FF7800] transition-colors" />
                  <input
                    autoFocus
                    type="tel"
                    value={data.phone}
                    onChange={(e) => { 
                      let val = e.target.value;
                      if (!val.startsWith('+')) val = '+' + val.replace(/\D/g, '');
                      setData({ ...data, phone: val }); 
                      setError(null); 
                    }}
                    placeholder="+998..."
                    className={`w-full bg-gray-50 rounded-2xl py-5 pl-14 pr-4 text-sm font-bold border-2 transition-all shadow-inner outline-none ${error ? 'border-red-500' : 'border-transparent focus:border-[#FF7800]'}`}
                  />
                </div>
                {error && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{error}</p>}
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setView('manual-name')} className="w-1/4 bg-gray-50 text-gray-300 py-5 rounded-2xl font-black flex items-center justify-center active:scale-90 transition-all">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                 </button>
                 <button
                    disabled={data.phone.length < 5}
                    onClick={handleManualPhoneSubmit}
                    className="flex-grow bg-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                    style={{ color: BRAND_ORANGE }}
                  >
                    ГОТОВО
                  </button>
              </div>
            </div>
          )}

          {view === 'verifying' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-700">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-orange-50 rounded-full animate-spin" style={{ borderTopColor: BRAND_ORANGE }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-[#FF7800] opacity-20" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-black">Почти готово...</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Проверка данных</p>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="p-12 text-center">
        <div className="flex items-center justify-center gap-3 opacity-10 grayscale mb-4">
           <ShieldCheck className="w-5 h-5" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Auth</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GOOGLE_SHEET_CSV_URL, BACKEND_API_URL, BRAND_ORANGE } from './constants';
import { safeHaptic, safeShowAlert, safeShowConfirm, trackEvent } from './utils';
import { StreetDogLogo } from './components/StreetDogLogo';
import { Burger, CartItem, ProductOption } from './types';
import BurgerCard from './components/BurgerCard';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import OrderHistory from './components/OrderHistory';
import Onboarding from './components/Onboarding';
import RestaurantSelector from './components/RestaurantSelector';
import OrderTypeSelector from './components/OrderTypeSelector';
import SuccessScreen from './components/SuccessScreen';
import { ShoppingCart, Utensils, Search, RefreshCw, Check, MapPin, AlertCircle, History } from 'lucide-react';

interface CustomerData {
  name: string;
  phone: string;
  address: string;
  orderType: 'pickup' | 'delivery' | null;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone?: string;
}

const transformDriveUrl = (url: string): string => {
  if (!url) return '';
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|docs\.google\.com\/file\/d\/)([\w-]+)/;
  const match = url.match(driveRegex);
  return match && match[1] ? `https://lh3.googleusercontent.com/d/${match[1]}` : url;
};

const cleanCell = (val: string | undefined) => {
  if (!val) return '';
  return val.replace(/^"|"$/g, '').replace(/""/g, '"').replace(/\u00a0/g, ' ').trim();
};

const parsePrice = (val: string | undefined) => {
  const s = cleanCell(val);
  return parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
};

const parseBoolean = (val: string | undefined) => {
  const s = cleanCell(val).toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'on' || s === 'да';
};

const parseList = (val: string | undefined, separator = ',') => {
  const s = cleanCell(val);
  if (!s) return [];
  return s.split(separator).map(item => item.trim()).filter(Boolean);
};

const parseOptions = (val: string | undefined): ProductOption[] | undefined => {
  const s = cleanCell(val);
  if (!s) return undefined;
  const opts = s.split(';').map(opt => {
    const parts = opt.split(':');
    const name = parts[0]?.trim();
    const priceStr = parts[1] || '0';
    return { name, price: parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0 };
  }).filter(o => o.name);
  return opts.length > 0 ? opts : undefined;
};


const postOrderWithXhr = (url: string, payload: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.timeout = 15000;

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText || '');
      } else {
        reject(new Error(`XHR ${xhr.status}: ${(xhr.responseText || '').slice(0, 120)}`));
      }
    };

    xhr.onerror = () => reject(new Error('XHR network error'));
    xhr.ontimeout = () => reject(new Error('XHR timeout'));
    xhr.send(payload);
  });
};

export const App: React.FC = () => {
  const tg = window.Telegram?.WebApp;
  
  const [isRegistered, setIsRegistered] = useState<boolean>(() => localStorage.getItem('sd_registered') === 'true');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [orderTypeChosen, setOrderTypeChosen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'history' | 'cart'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderComment, setOrderComment] = useState<string>('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => localStorage.getItem('sd_active_order_id'));
  const [allProducts, setAllProducts] = useState<Burger[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Burger | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [customerData, setCustomerData] = useState<CustomerData>(() => {
    const saved = localStorage.getItem('sd_user');
    return saved ? JSON.parse(saved) : {
      name: tg?.initDataUnsafe?.user?.first_name || '',
      phone: '',
      address: '',
      orderType: null
    };
  });

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.selectedOption ? item.selectedOption.price : item.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach(p => {
      if (p.category && p.available) cats.add(p.category.trim());
    });
    return ['All', ...Array.from(cats).sort()];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!selectedRestaurant) return [];
    return allProducts.filter(p => {
      if (!p.available) return false;
      const matchesCategory = selectedCategory === 'All' || 
        p.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRestaurant = !p.restaurantIds || 
                                p.restaurantIds.length === 0 || 
                                p.restaurantIds.some(id => id.toLowerCase() === 'all') || 
                                p.restaurantIds.includes(selectedRestaurant.id);
      return matchesCategory && matchesSearch && matchesRestaurant;
    });
  }, [allProducts, selectedCategory, searchQuery, selectedRestaurant]);

  const handleRegistrationComplete = async (d: { name: string; phone: string; address: string }) => {
    const newData = { ...customerData, ...d };
    setCustomerData(newData);
    localStorage.setItem('sd_user', JSON.stringify(newData));
    localStorage.setItem('sd_registered', 'true');
    setIsRegistered(true);

    const payload = {
      type: 'registration',
      ...d,
      tgUser: tg?.initDataUnsafe?.user || { id: 'web-user', first_name: d.name },
      platform: tg?.platform || 'web'
    };

    try {
      fetch(BACKEND_API_URL, { 
        method: 'POST', 
        headers: {'Content-Type': 'text/plain'}, 
        body: JSON.stringify(payload) 
      });
    } catch (e) {
      console.error("Failed to save customer", e);
    }

    safeHaptic('success');
    trackEvent('registration_complete', { name: d.name });
  };

  const handleCheckout = useCallback(async () => {
    if (isSending || cart.length === 0) return;
    if (!selectedRestaurant) {
      safeShowAlert("Выберите филиал перед оформлением заказа");
      return;
    }
    if (customerData.name.length < 2 || customerData.phone.length < 5) {
      safeShowAlert("Пожалуйста, заполните имя и телефон");
      return;
    }

    setIsSending(true);
    tg?.MainButton?.showProgress(false);
    
    const payload = { 
      type: 'order',
      ...customerData, 
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.selectedOption ? item.selectedOption.price : item.price,
        quantity: item.quantity,
        option: item.selectedOption ? item.selectedOption.name : null
      })), 
      total: cartTotal, 
      comment: orderComment, 
      restaurant: selectedRestaurant,
      tgUser: tg?.initDataUnsafe?.user || { id: "unknown", first_name: customerData.name }
    };

    try {
      const serializedPayload = JSON.stringify(payload);
      let textResponse = '';

      try {
        const res = await fetch(BACKEND_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: serializedPayload
        });

        textResponse = await res.text();

        if (!res.ok) {
          throw new Error(`Сервер вернул ${res.status}. ${textResponse.slice(0, 120)}`);
        }
      } catch (fetchError) {
        console.warn('Fetch order request failed, trying XHR fallback...', fetchError);
        textResponse = await postOrderWithXhr(BACKEND_API_URL, serializedPayload);
      }

      // Проверяем на HTML ответ (ошибка доступа Google Script)
      if (textResponse.trim().startsWith('<!DOCTYPE html') || textResponse.includes('Google Accounts')) {
         throw new Error("⚠️ Ошибка настройки! Скрипт Google недоступен. Убедитесь, что при Deploy вы выбрали 'Who has access: Anyone' (Все).");
      }

      let result;
      try {
        result = JSON.parse(textResponse);
      } catch (e) {
        console.error("Server raw response:", textResponse);
        throw new Error("Ошибка сервера (неверный формат ответа).");
      }

      if (result.status === 'success') {
        safeHaptic('success');
        setActiveOrderId(result.orderId);
        localStorage.setItem('sd_active_order_id', result.orderId);
        setCart([]);
        trackEvent('order_success', { orderId: result.orderId, branch: selectedRestaurant?.id });
      } else {
        throw new Error(result.message || "Неизвестная ошибка");
      }
    } catch (e: any) {
      console.error(e);
      let msg = e.message;
      if (msg === 'Failed to fetch') msg = 'Проблема с интернетом или сервером.';
      safeShowAlert("Не удалось отправить заказ. " + msg);
    } finally {
      setIsSending(false);
      tg?.MainButton?.hideProgress();
    }
  }, [tg, isSending, customerData, cart, cartTotal, orderComment, selectedRestaurant]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`);
        const csv = await res.text();
        const rows = csv.split(/\r?\n/).slice(1);
        const parsed: Burger[] = rows.map((row, i): Burger | null => {
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (cols.length < 2) return null;
          return {
            id: cleanCell(cols[0]) || `row-${i}`,
            name: cleanCell(cols[1]),
            description: cleanCell(cols[2]),
            price: parsePrice(cols[3]),
            images: parseList(cols[4]).map(transformDriveUrl),
            category: (cleanCell(cols[5]) || 'Burgers') as any,
            available: parseBoolean(cols[6]),
            isHot: parseBoolean(cols[7]),
            isNew: parseBoolean(cols[8]),
            options: parseOptions(cols[9]),
            restaurantIds: parseList(cols[10])
          };
        }).filter((p): p is Burger => p !== null && !!p.name);
        setAllProducts(parsed);
      } catch (e) { setError("Ошибка загрузки меню"); } finally { setLoading(false); }
    };
    fetchData();
    if (tg) { tg.ready(); tg.expand(); }
  }, []);

  useEffect(() => {
    if (!tg) return;
    if (activeTab === 'cart' && cart.length > 0 && !activeOrderId) {
      const isDelivery = customerData.orderType === 'delivery';
      const isValid = customerData.name.length > 1 && customerData.phone.length > 5 && (!isDelivery || (customerData.address && customerData.address.length >= 3));
      tg.MainButton.setParams({
        text: isSending ? 'ОТПРАВЛЯЕМ...' : (isValid ? `ОФОРМИТЬ: ${cartTotal.toLocaleString()} СУМ` : 'УКАЖИТЕ ДАННЫЕ'),
        color: isValid && !isSending ? '#000000' : '#E5E7EB',
        textColor: isValid && !isSending ? BRAND_ORANGE : '#9CA3AF',
        isVisible: true,
        isActive: !!(isValid && !isSending)
      });
      tg.MainButton.onClick(handleCheckout);
      return () => tg.MainButton.offClick(handleCheckout);
    } else { tg.MainButton.hide(); }
  }, [activeTab, cart, customerData, cartTotal, activeOrderId, isSending, handleCheckout, tg]);

  if (activeOrderId) return <SuccessScreen orderId={activeOrderId} onClose={() => {
    setActiveOrderId(null);
    localStorage.removeItem('sd_active_order_id');
  }} />;

  if (!isRegistered) return <Onboarding onConfirm={handleRegistrationComplete} />;

  if (!selectedRestaurant) return <RestaurantSelector onSelect={(r) => { setSelectedRestaurant(r); safeHaptic('medium'); }} />;
  
  if (!orderTypeChosen) return (
    <OrderTypeSelector onSelect={(type, addr) => { 
      setCustomerData(p => ({...p, orderType: type, address: addr || p.address})); 
      setOrderTypeChosen(true); 
      safeHaptic('medium');
    }} />
  );

  return (
    <div className="min-h-screen pb-20 flex flex-col max-w-md mx-auto bg-gray-50/30">
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-black text-[#FF7800] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl border border-white/10">
            <Check className="w-3 h-3" /> {toastMessage}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 p-3 pt-4 rounded-b-[2rem] shadow-md" style={{ backgroundColor: BRAND_ORANGE }}>
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex items-center gap-2">
             <StreetDogLogo className="h-7" iconColor="white" textColor="black" />
             <button 
               onClick={() => { setSelectedRestaurant(null); setOrderTypeChosen(false); safeHaptic('light'); }}
               className="bg-black/10 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/20 active:scale-95 transition-all"
             >
               <MapPin className="w-2.5 h-2.5 text-black" />
               <span className="text-[8px] font-black uppercase text-black max-w-[70px] truncate">{selectedRestaurant.name}</span>
             </button>
          </div>
          <button onClick={() => { setActiveTab('cart'); safeHaptic('light'); }} className={`relative p-2 rounded-xl shadow-md transition-all active:scale-90 ${activeTab === 'cart' ? 'bg-black text-white' : 'bg-white text-black'}`}>
            <ShoppingCart className="w-3.5 h-3.5" />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-[#FF7800] text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm">{cartCount}</span>}
          </button>
        </div>

        {activeTab === 'menu' && (
          <div className="space-y-2 px-1 pb-0.5 animate-in slide-in-from-top-1 duration-300">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Поиск..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white rounded-xl py-1.5 pl-9 pr-3 text-[10px] font-bold outline-none shadow-sm" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {availableCategories.map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); safeHaptic('light'); }} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-black text-[#FF7800]' : 'bg-white/30 text-black'}`}>{cat === 'All' ? 'Всё' : cat}</button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="p-3 flex-grow">
        {loading ? (
          <div className="py-24 flex flex-col items-center text-gray-300">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#FF7800]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Загрузка меню...</span>
          </div>
        ) : activeTab === 'menu' ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(p => (
              <BurgerCard key={p.id} burger={p} onAddToCart={(prod) => {
                setCart(prev => {
                  const ex = prev.find(i => i.id === prod.id && i.selectedOption?.name === prod.options?.[0]?.name);
                  if (ex) return prev.map(i => (i.id === prod.id && i.selectedOption?.name === prod.options?.[0]?.name) ? { ...i, quantity: i.quantity + 1 } : i);
                  return [...prev, { ...prod, quantity: 1, selectedOption: prod.options?.[0] }];
                });
                setToastMessage(`${prod.name} +1`);
                setTimeout(() => setToastMessage(null), 1200);
                safeHaptic('light');
              }} onClick={setSelectedProduct} />
            ))}
          </div>
        ) : activeTab === 'history' ? (
          <OrderHistory phone={customerData.phone} />
        ) : (
          <Cart items={cart} onUpdateQuantity={(id, delta, opt) => {
            setCart(p => p.map(i => (i.id === id && i.selectedOption?.name === opt) ? {...i, quantity: Math.max(0, i.quantity + delta)} : i).filter(i => i.quantity > 0));
            safeHaptic('light');
          }} customerData={customerData as any} selectedRestaurant={selectedRestaurant} onCustomerDataChange={(f,v) => setCustomerData(p => ({...p, [f]: v}))} comment={orderComment} onCommentChange={setOrderComment} onCheckout={handleCheckout} isSending={isSending} />
        )}
      </main>

      {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={(p, opt) => {
        setCart(prev => {
          const ex = prev.find(i => i.id === p.id && i.selectedOption?.name === opt?.name);
          if (ex) return prev.map(i => (i.id === p.id && i.selectedOption?.name === opt?.name) ? { ...i, quantity: i.quantity + 1 } : i);
          return [...prev, { ...p, quantity: 1, selectedOption: opt }];
        });
        setSelectedProduct(null);
        safeHaptic('success');
      }} />}

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t px-4 py-2 flex justify-around shadow-2xl">
        <NavBtn active={activeTab === 'menu'} onClick={() => { setActiveTab('menu'); safeHaptic('light'); }} icon={<Utensils className="w-4 h-4" />} label="Меню" />
        <NavBtn active={activeTab === 'cart'} onClick={() => { setActiveTab('cart'); safeHaptic('light'); }} icon={<ShoppingCart className="w-4 h-4" />} label="Корзина" />
        <NavBtn active={activeTab === 'history'} onClick={() => { setActiveTab('history'); safeHaptic('light'); }} icon={<History className="w-4 h-4" />} label="История" />
      </nav>
    </div>
  );
};

const NavBtn: React.FC<{active: boolean, onClick: () => void, icon: any, label: string}> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 ${active ? 'text-black' : 'text-gray-300'}`}>
    <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-[#FF7800] text-white shadow-md' : 'bg-transparent'}`}>{icon}</div>
    <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

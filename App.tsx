
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GOOGLE_SHEET_CSV_URL, BACKEND_API_URL, BRAND_ORANGE } from './constants';
import { safeHaptic, safeShowAlert, trackEvent } from './utils';
import { StreetDogLogo } from './components/StreetDogLogo';
import { Burger, CartItem, ProductOption } from './types';
import BurgerCard from './components/BurgerCard';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import OrderHistory from './components/OrderHistory';
import Onboarding from './components/Onboarding';
import RestaurantSelector from './components/RestaurantSelector';
import OrderTypeSelector from './components/OrderTypeSelector';
import FloatingStatus from './components/FloatingStatus';
import { ShoppingCart, Utensils, Search, RefreshCw, Check, MapPin, History } from 'lucide-react';

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
  image?: string;
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

export const App: React.FC = () => {
  const tg = window.Telegram?.WebApp;
  
  const [isRegistered, setIsRegistered] = useState<boolean>(() => localStorage.getItem('sd_registered') === 'true');

  useEffect(() => {
    if (isRegistered) {
      const isSynced = localStorage.getItem('sd_user_synced');
      if (!isSynced) {
        const d = JSON.parse(localStorage.getItem('sd_user') || '{}');
        if (d.name && d.phone) {
          const payload = {
            type: 'registration',
            ...d,
            tgUser: tg?.initDataUnsafe?.user || { id: 'web-user', first_name: d.name },
            platform: tg?.platform || 'web'
          };
          fetch(BACKEND_API_URL, { 
            method: 'POST', 
            mode: 'no-cors', // Для регистрации можно использовать no-cors, так как нам не важен ответ
            credentials: 'omit',
            body: JSON.stringify(payload) 
          }).then(() => {
            localStorage.setItem('sd_user_synced', 'true');
          }).catch(() => {}); // Тихий провал для фоновой синхронизации
        }
      }
    }
  }, [isRegistered, tg?.initDataUnsafe?.user, tg?.platform]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(() => {
    const saved = localStorage.getItem('sd_selected_restaurant');
    return saved ? JSON.parse(saved) : null;
  });
  const [orderTypeChosen, setOrderTypeChosen] = useState<boolean>(() => localStorage.getItem('sd_order_type_chosen') === 'true');
  const [activeTab, setActiveTab] = useState<'menu' | 'history' | 'cart'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderComment, setOrderComment] = useState<string>('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => localStorage.getItem('sd_active_order_id'));
  const [allProducts, setAllProducts] = useState<Burger[]>(() => {
    const saved = localStorage.getItem('sd_menu_cache');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedProduct, setSelectedProduct] = useState<Burger | null>(null);
  const [loading, setLoading] = useState<boolean>(allProducts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStatusMinimized, setIsStatusMinimized] = useState<boolean>(false);
  
  const checkoutHandlerRef = React.useRef<() => void>(() => {});

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
      // Отправляем без заголовков, чтобы избежать CORS preflight ошибок 'Load failed'
      fetch(BACKEND_API_URL, { 
        method: 'POST', 
        mode: 'no-cors',
        credentials: 'omit',
        body: JSON.stringify(payload) 
      }).then(() => {
        localStorage.setItem('sd_user_synced', 'true');
      }).catch(() => {});
    } catch (e) {
      console.error("Registration logging failed", e);
    }

    safeHaptic('success');
    trackEvent('registration_complete', { name: d.name });
  };

  const handleCheckout = useCallback(async () => {
    if (isSending || cart.length === 0) return;
    
    const isDelivery = customerData.orderType === 'delivery';
    if (customerData.name.trim().length < 2 || customerData.phone.trim().length < 5 || (isDelivery && (!customerData.address || customerData.address.trim().length < 3))) {
      safeShowAlert("Пожалуйста, заполните Имя, Телефон и Адрес!");
      return;
    }

    setIsSending(true);
    if (tg?.MainButton) tg.MainButton.showProgress(false);
    
    const orderPayload = { 
      type: 'order',
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address,
      orderType: customerData.orderType,
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
      console.log("🚀 Sending Order...");
      
      /**
       * КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Используем максимально простой запрос.
       * Мы не устанавливаем Content-Type и не форсируем mode: 'cors',
       * чтобы избежать preflight OPTIONS запроса, который GAS может отклонить.
       */
      const res = await fetch(BACKEND_API_URL, { 
        method: 'POST',
        credentials: 'omit',
        body: JSON.stringify(orderPayload) 
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        if (text.includes("Google Accounts")) {
          throw new Error("Скрипт требует доступа 'Anyone'. Проверьте настройки Deploy.");
        }
        throw new Error("Ошибка обработки ответа сервера. Проверьте скрипт.");
      }

      if (result.status === 'success') {
        safeHaptic('success');
        console.log("✅ Order Success:", result.orderId);
        if (result.tg) console.log("🤖 Telegram Response:", result.tg);
        
        setActiveOrderId(result.orderId);
        localStorage.setItem('sd_active_order_id', result.orderId);
        setCart([]);
        trackEvent('order_success', { orderId: result.orderId });
      } else {
        throw new Error(result.message || "Сервер не подтвердил заказ.");
      }

    } catch {
      console.error("❌ Checkout Error:", "Unknown error");
      const errorMsg = "Проблема с сетью или доступом к серверу. Попробуйте еще раз или проверьте интернет.";
      safeShowAlert("Ошибка отправки: " + errorMsg);
    } finally {
      setIsSending(false);
      if (tg?.MainButton) tg.MainButton.hideProgress();
    }
  }, [tg, isSending, customerData, cart, cartTotal, orderComment, selectedRestaurant]);

  // Обновляем реф при каждом изменении handleCheckout
  useEffect(() => {
    checkoutHandlerRef.current = handleCheckout;
  }, [handleCheckout]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`, {
        credentials: 'omit'
      });
      if (!res.ok) throw new Error("Не удалось загрузить меню");
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
      
      if (parsed.length === 0) throw new Error("Меню пустое. Проверьте таблицу.");
      
      setAllProducts(parsed);
      localStorage.setItem('sd_menu_cache', JSON.stringify(parsed));
    } catch (e: any) { 
      console.error("Menu Load Error:", e);
      setError(e.message); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (tg) { 
      tg.ready(); 
      tg.expand(); 
    }
  }, [tg, fetchData]);

  useEffect(() => {
    if (!tg || !tg.MainButton) return;
    
    const onMainButtonClick = () => {
      checkoutHandlerRef.current();
    };

    if (activeTab === 'cart' && cart.length > 0 && !activeOrderId) {
      const isDelivery = customerData.orderType === 'delivery';
      const isValid = customerData.name.trim().length > 1 && 
                      customerData.phone.trim().length > 5 && 
                      (!isDelivery || (customerData.address && customerData.address.trim().length >= 3));
      
      tg.MainButton.setParams({
        text: isSending ? 'ОТПРАВЛЯЕМ...' : (isValid ? `ОФОРМИТЬ: ${cartTotal.toLocaleString()} СУМ` : 'ЗАПОЛНИТЕ ДАННЫЕ'),
        color: isValid && !isSending ? '#000000' : '#E5E7EB',
        textColor: isValid && !isSending ? BRAND_ORANGE : '#9CA3AF',
        isVisible: true,
        isActive: !!(isValid && !isSending)
      });
      
      tg.MainButton.onClick(onMainButtonClick);
      return () => tg.MainButton.offClick(onMainButtonClick);
    } else { 
      tg.MainButton.hide(); 
    }
  }, [activeTab, cart, customerData, cartTotal, activeOrderId, isSending, tg]);

  if (!isRegistered) return <Onboarding onConfirm={handleRegistrationComplete} />;

  if (!selectedRestaurant) return <RestaurantSelector onSelect={(r) => { 
    setSelectedRestaurant(r); 
    localStorage.setItem('sd_selected_restaurant', JSON.stringify(r));
    safeHaptic('medium'); 
  }} />;
  
  if (!orderTypeChosen) return (
    <OrderTypeSelector onSelect={(type, addr) => { 
      setCustomerData(p => ({...p, orderType: type, address: addr || p.address})); 
      setOrderTypeChosen(true); 
      localStorage.setItem('sd_order_type_chosen', 'true');
      safeHaptic('medium');
    }} />
  );

  return (
    <div 
      className={`min-h-screen pb-20 flex flex-col max-w-md mx-auto bg-gray-50/30 ${activeOrderId ? (isStatusMinimized ? 'pt-[80px]' : 'pt-[340px]') : ''}`}
    >
      {activeOrderId && (
        <FloatingStatus 
          key={activeOrderId}
          orderId={activeOrderId} 
          orderType={customerData.orderType}
          restaurantPhone={selectedRestaurant?.phone}
          isMinimized={isStatusMinimized}
          onToggleMinimize={() => setIsStatusMinimized(!isStatusMinimized)}
          onClose={() => {
            setActiveOrderId(null);
            localStorage.removeItem('sd_active_order_id');
          }} 
        />
      )}

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-black text-[#FF7800] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl border border-white/10">
            <Check className="w-3 h-3" /> {toastMessage}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500 text-white p-2 text-[10px] font-bold text-center">
          {error}
        </div>
      )}

      <header className="sticky top-0 z-30 p-3 pt-2 rounded-b-[2rem] shadow-md" style={{ backgroundColor: BRAND_ORANGE }}>
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
             <button 
               onClick={() => { fetchData(); safeHaptic('medium'); }}
               className={`p-2 rounded-xl transition-all active:scale-90 bg-white/20 text-black ${loading ? 'animate-spin' : ''}`}
             >
               <RefreshCw className="w-3 h-3" />
             </button>
          </div>
          <button onClick={() => { setActiveTab('cart'); safeHaptic('light'); }} className={`relative p-2 rounded-xl shadow-md transition-all active:scale-90 ${activeTab === 'cart' ? 'bg-black text-white' : 'bg-white text-black'}`}>
            <ShoppingCart className="w-3.5 h-3.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in duration-300">
                {cartCount}
              </span>
            )}
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
        {loading && allProducts.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-gray-300">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#FF7800]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Загрузка меню...</span>
          </div>
        ) : error && allProducts.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center px-6">
            <RefreshCw className="w-8 h-8 mb-4 text-red-400 opacity-50" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{error}</p>
            <button onClick={fetchData} className="bg-black text-[#FF7800] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
              Попробовать снова
            </button>
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
          <Cart 
            items={cart} 
            onUpdateQuantity={(id, delta, opt) => {
              setCart(p => p.map(i => (i.id === id && i.selectedOption?.name === opt) ? {...i, quantity: Math.max(0, i.quantity + delta)} : i).filter(i => i.quantity > 0));
              safeHaptic('light');
            }} 
            customerData={customerData as any} 
            selectedRestaurant={selectedRestaurant} 
            onCustomerDataChange={(f,v) => setCustomerData(p => ({...p, [f]: v}))} 
            comment={orderComment} 
            onCommentChange={setOrderComment}
            onCheckout={handleCheckout}
            isSending={isSending}
          />
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
        <NavBtn 
          active={activeTab === 'cart'} 
          onClick={() => { setActiveTab('cart'); safeHaptic('light'); }} 
          icon={<ShoppingCart className="w-4 h-4" />} 
          label="Корзина" 
          badge={cartCount > 0 ? cartCount : undefined}
        />
        <NavBtn active={activeTab === 'history'} onClick={() => { setActiveTab('history'); safeHaptic('light'); }} icon={<History className="w-4 h-4" />} label="История" />
      </nav>
    </div>
  );
};

const NavBtn: React.FC<{active: boolean, onClick: () => void, icon: any, label: string, badge?: number}> = ({ active, onClick, icon, label, badge }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 ${active ? 'text-black' : 'text-gray-300'}`}>
    <div className={`relative p-1.5 rounded-lg transition-all ${active ? 'bg-[#FF7800] text-white shadow-md' : 'bg-transparent'}`}>
      {icon}
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[6px] font-black w-3 h-3 flex items-center justify-center rounded-full border border-white shadow-sm">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

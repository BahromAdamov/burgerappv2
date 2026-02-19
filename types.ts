
export interface ProductOption {
  name: string;
  price: number;
}

export interface Burger {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: 'Burgers' | 'Hot Dogs' | 'Drinks' | 'Sides';
  available: boolean;
  isHot?: boolean;
  isNew?: boolean;
  options?: ProductOption[];
  restaurantIds?: string[]; // Список ID филиалов, где доступно блюдо
}

export interface CartItem extends Burger {
  quantity: number;
  selectedOption?: ProductOption;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  favoriteFlavors: string[];
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        sendData: (data: string) => void;
        initDataUnsafe: {
          user?: { id: number; first_name: string; last_name?: string; username?: string; };
        };
        isVersionAtLeast: (version: string) => boolean;
        // Added platform and version properties for Telegram WebApp
        platform: string;
        version: string;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setParams: (params: any) => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback: (ok: boolean) => void) => void;
        requestContact: (callback: (response: any) => void) => void;
      };
    };
  }
}

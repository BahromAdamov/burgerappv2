
import { BACKEND_API_URL } from './constants';

export const safeShowAlert = (message: string, callback?: () => void) => {
  const tg = window.Telegram?.WebApp;
  // showAlert доступен с версии 6.2
  if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2') && tg.showAlert) {
    tg.showAlert(message, callback);
  } else {
    alert(message);
    if (callback) callback();
  }
};

export const safeShowConfirm = (message: string, callback: (ok: boolean) => void) => {
  const tg = window.Telegram?.WebApp;
  // showConfirm доступен с версии 6.2
  if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2') && tg.showConfirm) {
    tg.showConfirm(message, callback);
  } else {
    const ok = confirm(message);
    callback(ok);
  }
};

export const safeHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) {
    try {
      if (['light', 'medium', 'heavy'].includes(type)) {
        tg.HapticFeedback.impactOccurred(type as any);
      } else {
        tg.HapticFeedback.notificationOccurred(type as any);
      }
    } catch (e) {
      console.warn('Haptic not supported', e);
    }
  }
};

/**
 * Логирование событий для аналитики (отправка в Google Таблицу)
 */
export const trackEvent = async (eventName: string, eventData: any = {}) => {
  const tg = window.Telegram?.WebApp;
  
  const payload = {
    type: 'analytics',
    event: eventName,
    data: eventData,
    user: {
      id: tg?.initDataUnsafe?.user?.id || 'unknown',
      first_name: tg?.initDataUnsafe?.user?.first_name || 'WebUser',
      username: tg?.initDataUnsafe?.user?.username || ''
    },
    platform: tg?.platform || 'web',
    version: tg?.version || 'unknown',
    timestamp: new Date().toISOString()
  };

  try {
    // Используем mode: 'no-cors' для быстрой отправки аналитики без ожидания ответа
    fetch(BACKEND_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Analytics tracking failed', e);
  }
};

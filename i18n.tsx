import React, { createContext, useContext, useMemo, useState } from 'react';

export type Language = 'ru' | 'uz';

type TranslationKey = keyof typeof translations.ru;

const LANGUAGE_STORAGE_KEY = 'sd_language';

const translations = {
  ru: {
    chooseLanguage: 'Выберите язык',
    chooseLanguageSubtitle: 'Tilni tanlang / Выберите язык',
    russian: 'Русский',
    uzbek: 'Узбекский',
    start: 'НАЧАТЬ',
    welcome: 'Добро пожаловать!',
    authRequired: 'Для заказа необходимо авторизоваться',
    quickLogin: 'БЫСТРЫЙ ВХОД',
    manualInput: 'Ввести вручную',
    yourName: 'Как вас зовут?',
    namePlaceholder: 'Ваше имя',
    continue: 'Продолжить',
    yourPhone: 'Ваш номер телефона',
    phonePlaceholder: '+998 90 000 00 00',
    verify: 'Проверить',
    checking: 'Проверяем...',
    done: 'ГОТОВО',
    almostReady: 'Почти готово...',
    dataCheck: 'Проверка данных',
    enterValidPhone: 'Введите корректный номер',
    back: 'Назад',
    whereOrder: 'Где заказываем?',
    chooseNearestBranch: 'Выберите ближайший филиал',
    selected: 'Выбрано',
    howPickup: 'Как заберёте?',
    deliveryAddress: 'Адрес доставки',
    receiveMethod: 'Способ получения',
    deliveryDestination: 'Куда привезти заказ?',
    pickup: 'Самовывоз',
    fromCafe: 'Из кафе',
    delivery: 'Доставка',
    deliveryRadius: 'Доставка в радиусе 5км 10.000',
    streetAndHouse: 'Улица и дом',
    yourAddress: 'Ваш адрес...',
    findMe: 'Найти меня',
    flatOffice: 'Кв / Офис',
    comment: 'Комментарий',
    commentPlaceholder: 'Ориентиры, подъезд...',
    confirm: 'Подтвердить',
    geoUnsupported: 'Геолокация не поддерживается вашим устройством.',
    coordsAddress: 'Адрес определен в виде координат.',
    gpsFailed: 'Не удалось получить доступ к GPS. Введите адрес вручную.',
    enterValidAddress: 'Введите корректный адрес',
    search: 'Поиск...',
    all: 'Всё',
    loadingMenu: 'Загрузка меню...',
    tryAgain: 'Попробовать снова',
    menu: 'Меню',
    cart: 'Корзина',
    history: 'История',
    emptyCart: 'Корзина пуста',
    addSomething: 'Пора добавить что-нибудь вкусное!',
    yourOrder: 'Ваш заказ',
    positions: 'ПОЗИЦИИ',
    deliveryFromCafe: 'Доставка из кафе',
    pickupFromCafe: 'Заберу из кафе',
    courier: 'КУРЬЕР',
    pickupUpper: 'САМОВЫВОЗ',
    contactData: 'Контактные данные',
    nameInput: 'Как вас зовут?',
    phoneInput: 'Ваш номер',
    deliverTo: 'Куда доставить?',
    orderComment: 'Комментарий к заказу',
    wishes: 'Ориентир, пожелания...',
    toPay: 'К оплате',
    finalPrice: 'Итоговая стоимость',
    sum: 'сум',
    deliveryFeeText: 'в радиусе 5км 10.000',
    noPhoto: 'Нет фото',
    orderSize: 'Размер заказа',
    addToCart: 'В корзину',
    description: 'Описание',
    add: 'Добавить',
    pending: 'Ожидает',
    packed: 'Упакован',
    completedStatus: 'Завершен',
    cancelledStatus: 'Отменен',
    loadingHistory: 'Загружаем историю...',
    connectionError: 'Ошибка связи',
    noOrders: 'Заказов пока нет',
    firstOrderHint: 'Как только вы сделаете первый заказ, он появится здесь',
    order: 'ЗАКАЗ',
    noData: 'Нет данных',
    accepted: 'Принят',
    cooking: 'Готовится',
    onWay: 'В пути',
    ready: 'Готов',
    processing: 'В обработке',
    completed: 'ВЫПОЛНЕН',
    cancelled: 'ОТМЕНЕН',
    orderAcceptedSoon: 'Ваш заказ принят и скоро начнет готовиться',
    chefsCooking: 'Наши повара уже готовят ваш заказ',
    courierOnWay: 'Курьер уже в пути к вам',
    orderReadyWaiting: 'Заказ готов и ждет вас',
    followStatus: 'Следите за статусом',
    call: 'Позвонить',
    cancelByPhone: 'Для отмены заказа, пожалуйста, свяжитесь с нами по телефону.',
    sending: 'ОТПРАВЛЯЕМ...',
    checkout: 'ОФОРМИТЬ',
    fillData: 'ЗАПОЛНИТЕ ДАННЫЕ',
    fillNamePhoneAddress: 'Пожалуйста, заполните Имя, Телефон и Адрес!',
    checkoutError: 'Ошибка отправки: Проблема с сетью или доступом к серверу. Попробуйте еще раз или проверьте интернет.',
  },
  uz: {
    chooseLanguage: 'Tilni tanlang',
    chooseLanguageSubtitle: 'Oʻzbek yoki rus tilini tanlang',
    russian: 'Rus tili',
    uzbek: 'Oʻzbek tili',
    start: 'BOSHLASH',
    welcome: 'Xush kelibsiz!',
    authRequired: 'Buyurtma berish uchun roʻyxatdan oʻting',
    quickLogin: 'TEZ KIRISH',
    manualInput: 'Qoʻlda kiritish',
    yourName: 'Ismingiz?',
    namePlaceholder: 'Ismingiz',
    continue: 'Davom etish',
    yourPhone: 'Telefon raqamingiz',
    phonePlaceholder: '+998 90 000 00 00',
    verify: 'Tasdiqlash',
    checking: 'Tekshirilmoqda...',
    done: 'TAYYOR',
    almostReady: 'Deyarli tayyor...',
    dataCheck: 'Maʼlumotlar tekshirilmoqda',
    enterValidPhone: 'Toʻgʻri telefon raqamini kiriting',
    back: 'Orqaga',
    whereOrder: 'Qayerdan buyurtma beramiz?',
    chooseNearestBranch: 'Eng yaqin filialni tanlang',
    selected: 'Tanlandi',
    howPickup: 'Qanday olasiz?',
    deliveryAddress: 'Yetkazib berish manzili',
    receiveMethod: 'Qabul qilish usuli',
    deliveryDestination: 'Buyurtmani qayerga olib boramiz?',
    pickup: 'Olib ketish',
    fromCafe: 'Kafedan',
    delivery: 'Yetkazib berish',
    deliveryRadius: '5 km radiusda yetkazib berish 10.000',
    streetAndHouse: 'Koʻcha va uy',
    yourAddress: 'Manzilingiz...',
    findMe: 'Meni topish',
    flatOffice: 'Xonadon / Ofis',
    comment: 'Izoh',
    commentPlaceholder: 'Moʻljal, podʼyezd...',
    confirm: 'Tasdiqlash',
    geoUnsupported: 'Qurilmangiz geolokatsiyani qoʻllab-quvvatlamaydi.',
    coordsAddress: 'Manzil koordinatalar orqali aniqlandi.',
    gpsFailed: 'GPS ruxsatini olish imkoni boʻlmadi. Manzilni qoʻlda kiriting.',
    enterValidAddress: 'Toʻgʻri manzil kiriting',
    search: 'Qidirish...',
    all: 'Hammasi',
    loadingMenu: 'Menyu yuklanmoqda...',
    tryAgain: 'Qayta urinib koʻrish',
    menu: 'Menyu',
    cart: 'Savat',
    history: 'Tarix',
    emptyCart: 'Savat boʻsh',
    addSomething: 'Mazali nimadir qoʻshish vaqti!',
    yourOrder: 'Buyurtmangiz',
    positions: 'TA POZITSIYA',
    deliveryFromCafe: 'Kafedan yetkazib berish',
    pickupFromCafe: 'Kafedan olib ketaman',
    courier: 'KURYER',
    pickupUpper: 'OLIB KETISH',
    contactData: 'Aloqa maʼlumotlari',
    nameInput: 'Ismingiz?',
    phoneInput: 'Raqamingiz',
    deliverTo: 'Qayerga yetkazamiz?',
    orderComment: 'Buyurtmaga izoh',
    wishes: 'Moʻljal, tilaklar...',
    toPay: 'Toʻlov',
    finalPrice: 'Yakuniy narx',
    sum: 'soʻm',
    deliveryFeeText: '5 km radiusda 10.000',
    noPhoto: 'Rasm yoʻq',
    orderSize: 'Buyurtma oʻlchami',
    addToCart: 'Savatga',
    description: 'Tavsif',
    add: 'Qoʻshish',
    pending: 'Kutilmoqda',
    packed: 'Qadoqlandi',
    completedStatus: 'Yakunlandi',
    cancelledStatus: 'Bekor qilindi',
    loadingHistory: 'Tarix yuklanmoqda...',
    connectionError: 'Aloqa xatosi',
    noOrders: 'Hozircha buyurtmalar yoʻq',
    firstOrderHint: 'Birinchi buyurtma berganingizdan keyin u shu yerda paydo boʻladi',
    order: 'BUYURTMA',
    noData: 'Maʼlumot yoʻq',
    accepted: 'Qabul qilindi',
    cooking: 'Tayyorlanmoqda',
    onWay: 'Yoʻlda',
    ready: 'Tayyor',
    processing: 'Jarayonda',
    completed: 'BAJARILDI',
    cancelled: 'BEKOR QILINDI',
    orderAcceptedSoon: 'Buyurtmangiz qabul qilindi va tez orada tayyorlanadi',
    chefsCooking: 'Oshpazlarimiz buyurtmangizni tayyorlamoqda',
    courierOnWay: 'Kuryer siz tomon yoʻlda',
    orderReadyWaiting: 'Buyurtma tayyor va sizni kutmoqda',
    followStatus: 'Statusni kuzatib boring',
    call: 'Qoʻngʻiroq qilish',
    cancelByPhone: 'Buyurtmani bekor qilish uchun biz bilan telefon orqali bogʻlaning.',
    sending: 'YUBORILMOQDA...',
    checkout: 'RASMIYLASHTIRISH',
    fillData: 'MAʼLUMOTLARNI TOʻLDIRING',
    fillNamePhoneAddress: 'Iltimos, ism, telefon va manzilni toʻldiring!',
    checkoutError: 'Yuborish xatosi: Tarmoq yoki serverga ulanishda muammo. Yana urinib koʻring yoki internetni tekshiring.',
  }
} as const;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return saved === 'uz' || saved === 'ru' ? saved : 'ru';
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage: (nextLanguage) => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      setLanguageState(nextLanguage);
    },
    t: (key) => translations[language][key] || translations.ru[key],
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
};


export const localizeRestaurantText = (value: string, language: Language) => {
  if (language !== 'uz') return value;
  return value
    .replace('Центр', 'Markaz')
    .replace('Филиал 2', '2-filial')
    .replace('ул. Аль-Хоразмий', 'Al-Xorazmiy koʻchasi')
    .replace('ул. Хонка', 'Xonqa koʻchasi');
};

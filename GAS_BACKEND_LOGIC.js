
/**
 * Этот код предназначен для вашего Google Apps Script (GAS) бэкенда.
 * Он обновляет кнопки управления заказом в Telegram боте в соответствии с вашим запросом.
 */

function getTelegramButtons(orderId, orderType, currentStatus) {
  var buttons = [];
  
  if (orderType === 'pickup') {
    // Самовывоз: Принят -> Готовится -> Готов к выдаче
    if (currentStatus === 'pending') {
      buttons.push([{ text: "👨‍🍳 Начать готовить", callback_data: "status_cooking_" + orderId }]);
    } else if (currentStatus === 'cooking') {
      buttons.push([{ text: "📦 Готов к выдаче", callback_data: "status_ready_pickup_" + orderId }]);
    } else if (currentStatus === 'ready_pickup') {
      buttons.push([{ text: "🏁 Завершить заказ", callback_data: "status_completed_" + orderId }]);
    }
  } else {
    // Доставка: Принят -> Готовится -> Курьер везет
    if (currentStatus === 'pending') {
      buttons.push([{ text: "👨‍🍳 Начать готовить", callback_data: "status_cooking_" + orderId }]);
    } else if (currentStatus === 'cooking') {
      buttons.push([{ text: "🚚 Курьер везет", callback_data: "status_on_way_" + orderId }]);
    } else if (currentStatus === 'on_way') {
      buttons.push([{ text: "🏁 Завершить заказ", callback_data: "status_completed_" + orderId }]);
    }
  }
  
  // Кнопка отмены доступна до завершения
  if (currentStatus !== 'completed' && currentStatus !== 'cancelled') {
    buttons.push([{ text: "❌ Отменить заказ", callback_data: "status_cancelled_" + orderId }]);
  }
  
  return {
    inline_keyboard: buttons
  };
}

/**
 * Пример функции обновления статуса
 */
function updateOrderStatus(orderId, newStatus) {
  // 1. Обновите статус в Google Таблице
  // 2. Отправьте уведомление пользователю через Telegram API
  // 3. Обновите сообщение у админа с новыми кнопками, используя getTelegramButtons()
}


/**
 * ССЫЛКА НА ВАШУ ТАБЛИЦУ (CSV)
 */
export const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSdkoYN7PPVyAsjlMi9I9_1iRy-20RD78xsc9XgNcAbPsZcwimZ_bTynFYwtJvCR2MiitgeuzMu07Vq/pub?gid=0&single=true&output=csv';

/**
 * URL Google Apps Script для записи заказов.
 * ВНИМАНИЕ: После обновления кода в Google Script ОБЯЗАТЕЛЬНО сделайте NEW DEPLOYMENT 
 * и обновите эту ссылку здесь.
 */
export const BACKEND_API_URL = 'https://script.google.com/macros/s/AKfycbx0wuQ0rYgcTfTaCtHsQLWO-wCnukcyYKTkrzkYlZd31m3WmRyAv3m5UEtvtNHIvxCf/exec';
export const BRAND_ORANGE = '#FF7800';

/* 
===================================================================================
ОБНОВЛЕННЫЙ КОД ДЛЯ GOOGLE APPS SCRIPT (v13.0 - КРАСИВЫЕ ЗАКАЗЫ И СТАТУСЫ)
===================================================================================
1. Вставьте этот код в script.google.com.
2. Нажмите Deploy -> New Deployment (Web App, Me, Anyone).
3. Скопируйте полученный URL и обновите BACKEND_API_URL в constants.ts.
4. Выполните функцию setWebhook (вставьте URL в нее перед запуском).

var BRANCH_CONFIG = {
  "branch_1": { 
    name: "Street Dog (Центр)", 
    botToken: "8209335904:AAEImqgJspKY7rSQCqR_nvNYJLbI2iTHp5Q", 
    adminChatId: "-1003858564556"
  },
  "branch_2": { 
    name: "Street Dog (Филиал 2)", 
    botToken: "8482719451:AAG6ieM7T0hJzfqAZ7hqAN_Y-jzSB40QUUs", 
    adminChatId: "-1003747538798" 
  }
};

function setWebhook() {
  var webAppUrl = "ВАША_ССЫЛКА_ПОСЛЕ_DEPLOY_ЗДЕСЬ"; 
  for (var key in BRANCH_CONFIG) {
    var token = BRANCH_CONFIG[key].botToken;
    UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/setWebhook?url=" + webAppUrl);
  }
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    if (!e || !e.postData || !e.postData.contents) return response({ status: 'error' });
    var contents = JSON.parse(e.postData.contents);

    // А) ОБРАБОТКА НАЖАТИЯ КНОПОК
    if (contents.callback_query) return handleTelegramCallback(contents.callback_query, ss);

    // В) ОБРАБОТКА РЕГИСТРАЦИИ ПОЛЬЗОВАТЕЛЯ
    if (contents.type === 'registration') {
      var userSheet = getOrCreateSheet(ss, "Users");
      var tgUser = contents.tgUser || {};
      userSheet.appendRow([
        new Date(), 
        contents.name, 
        "'" + contents.phone, 
        contents.address || "N/A",
        tgUser.id || "N/A", 
        tgUser.username || "N/A", 
        contents.platform || "web"
      ]);
      return response({ status: 'success' });
    }

    // Г) ОБРАБОТКА АНАЛИТИКИ
    if (contents.type === 'analytics') {
      var analyticsSheet = getOrCreateSheet(ss, "Analytics");
      analyticsSheet.appendRow([
        new Date(), 
        contents.event, 
        JSON.stringify(contents.data), 
        contents.user ? contents.user.id : "N/A",
        contents.platform || "web"
      ]);
      return response({ status: 'success' });
    }

    // Д) ОБРАБОТКА НОВОГО ЗАКАЗА ИЗ ПРИЛОЖЕНИЯ
    if (contents.type === 'order') {
      var sheet = getOrCreateSheet(ss, "Orders");
      // Порядковый номер заказа (Заказ 0001)
      var nextNum = sheet.getLastRow(); 
      var orderId = "Заказ " + ("0000" + nextNum).slice(-4);
      
      var itemsStr = contents.items.map(function(i) { 
        return "• " + i.name + (i.option ? " ("+i.option+")" : "") + " x" + i.quantity; 
      }).join("\n");
      
      sheet.appendRow([
        new Date(), orderId, "pending", contents.restaurant ? contents.restaurant.name : "N/A",
        contents.name, "'"+contents.phone, contents.orderType, contents.total, itemsStr, 
        contents.comment, contents.address || "Самовывоз"
      ]);

      // Также логируем в аналитику
      var analyticsSheet = getOrCreateSheet(ss, "Analytics");
      analyticsSheet.appendRow([new Date(), "order_placed", orderId, contents.total, contents.items.length]);

      var tgRes = sendOrderToTelegram(contents, orderId, itemsStr);
      return response({ status: 'success', orderId: orderId });
    }
  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  }
}

function handleTelegramCallback(cb, ss) {
  var data = cb.data; 
  var parts = data.split('_');
  var action = parts[1]; // cooking, ready, cancelled, completed
  var orderId = parts.slice(2).join('_').trim();
  
  var sheet = ss.getSheetByName("Orders");
  var rows = sheet.getDataRange().getValues();
  var newStatus = action;
  
  for (var i = rows.length - 1; i >= 1; i--) {
    var sheetOrderId = rows[i][1].toString().trim();
    if (sheetOrderId == orderId) {
      var orderType = rows[i][6]; // pickup или delivery
      if (action === 'ready') {
        newStatus = (orderType === 'delivery') ? 'on_way' : 'ready_pickup';
      }
      sheet.getRange(i + 1, 3).setValue(newStatus);
      break;
    }
  }

  var statusLabels = { 
    "cooking": "👨‍🍳 Готовится", 
    "ready_pickup": "✅ ГОТОВО (Самовывоз)", 
    "on_way": "🚴 Курьер везет", 
    "completed": "🏁 ЗАВЕРШЕН",
    "cancelled": "❌ ОТМЕНЕНО" 
  };

  var token = BRANCH_CONFIG["branch_1"].botToken;
  for (var key in BRANCH_CONFIG) {
    if (BRANCH_CONFIG[key].adminChatId == cb.message.chat.id) {
      token = BRANCH_CONFIG[key].botToken;
      break;
    }
  }

  // Очищаем старый статус из текста, чтобы они не копились
  var cleanText = cb.message.text.split('\n\nСТАТУС:')[0];
  var newText = cleanText + "\n\n<b>СТАТУС: " + (statusLabels[newStatus] || newStatus) + "</b>";

  // Обновляем кнопки: если готов/в пути, добавляем кнопку "Завершить"
  var newKb = cb.message.reply_markup;
  if (newStatus === 'ready_pickup' || newStatus === 'on_way') {
    // Проверяем, нет ли уже кнопки "Завершить"
    var hasCompleted = false;
    for (var k=0; k<newKb.inline_keyboard.length; k++) {
      if (newKb.inline_keyboard[k][0].callback_data.indexOf('completed') !== -1) { hasCompleted = true; break; }
    }
    if (!hasCompleted) {
      newKb.inline_keyboard.push([{ text: "🏁 ЗАВЕРШИТЬ", callback_data: "status_completed_" + orderId }]);
    }
  } else if (newStatus === 'completed' || newStatus === 'cancelled') {
    newKb = { inline_keyboard: [] }; // Убираем кнопки после завершения или отмены
  }

  UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/editMessageText", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: newText,
      parse_mode: "HTML",
      reply_markup: newKb
    })
  });

  return response({ status: 'ok' });
}

function sendOrderToTelegram(order, orderId, itemsStr) {
  var config = (order.restaurant && BRANCH_CONFIG[order.restaurant.id]) ? BRANCH_CONFIG[order.restaurant.id] : BRANCH_CONFIG["branch_1"];
  
  var info = "<b>🔥 НОВЫЙ " + orderId.toUpperCase() + "</b>\n\n" +
             "👤 <b>Клиент:</b> " + order.name + "\n" +
             "📞 <b>Телефон:</b> " + order.phone + "\n" +
             "📍 <b>Тип:</b> " + (order.orderType === 'delivery' ? "🚀 Доставка" : "🥡 Самовывоз") + "\n";
  
  if (order.orderType === 'delivery') {
    info += "🏠 <b>Адрес:</b> " + (order.address || "Не указан") + "\n";
  }
  
  if (order.comment) {
    info += "💬 <b>Комментарий:</b> " + order.comment + "\n";
  }

  info += "\n🛒 <b>СОСТАВ ЗАКАЗА:</b>\n" + itemsStr + "\n\n" +
          "💰 <b>ИТОГО: " + order.total.toLocaleString() + " СУМ</b>";

  var kb = { inline_keyboard: [
    [{ text: "👨‍🍳 ПРИНЯТЬ", callback_data: "status_cooking_" + orderId }],
    [{ text: "✅ ГОТОВ", callback_data: "status_ready_" + orderId }],
    [{ text: "❌ ОТМЕНА", callback_data: "status_cancelled_" + orderId }]
  ]};

  return UrlFetchApp.fetch("https://api.telegram.org/bot" + config.botToken + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ chat_id: config.adminChatId, text: info, parse_mode: "HTML", reply_markup: kb })
  }).getContentText();
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. История заказов по номеру телефона
  if (e.parameter.historyPhone) {
    var phone = e.parameter.historyPhone.replace(/\D/g, '');
    var sheet = ss.getSheetByName("Orders");
    var data = sheet.getDataRange().getValues();
    var history = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var sheetPhone = data[i][5].toString().replace(/\D/g, '');
      if (sheetPhone.indexOf(phone) !== -1 || phone.indexOf(sheetPhone) !== -1) {
        history.push({
          date: data[i][0],
          orderId: data[i][1],
          status: data[i][2],
          branch: data[i][3],
          type: data[i][6],
          total: data[i][7],
          items: data[i][8],
          comment: data[i][9]
        });
      }
      if (history.length >= 20) break; // Лимит 20 заказов
    }
    return response(history);
  }

  // 2. Статус конкретного заказа
  var orderId = e.parameter.orderId;
  if (orderId) {
    var sheet = ss.getSheetByName("Orders");
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      var sheetOrderId = data[i][1].toString().trim();
      if (sheetOrderId == orderId.trim()) {
        return response({ status: data[i][2] || 'pending' });
      }
    }
    return response({ status: 'not_found' });
  }
  
  return response({ status: 'online' });
}

function getOrCreateSheet(ss, name) {
  var s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    if (name === "Users") {
      s.appendRow(["Дата", "Имя", "Телефон", "Адрес", "Telegram ID", "Username", "Платформа"]);
    } else if (name === "Orders") {
      s.appendRow(["Дата", "ID Заказа", "Статус", "Филиал", "Тип", "Имя", "Телефон", "Сумма", "Состав", "Комментарий", "Адрес", "Telegram ID"]);
    } else if (name === "Analytics") {
      s.appendRow(["Дата", "Событие", "Данные", "Telegram ID", "Платформа"]);
    }
  }
  return s;
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
===================================================================================
*/

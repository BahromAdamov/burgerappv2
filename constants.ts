
/**
 * ССЫЛКА НА ВАШУ ТАБЛИЦУ (CSV)
 */
export const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSdkoYN7PPVyAsjlMi9I9_1iRy-20RD78xsc9XgNcAbPsZcwimZ_bTynFYwtJvCR2MiitgeuzMu07Vq/pub?gid=0&single=true&output=csv';

/**
 * URL Google Apps Script для записи заказов.
 * ВНИМАНИЕ: Если вы обновили скрипт, убедитесь, что создали НОВУЮ версию развертывания (New Deployment) в Google.
 */
export const BACKEND_API_URL = 'https://script.google.com/macros/s/AKfycbzXULgTiSpFIv_2yTxV0ViIX5OH8-kXDqzX60emXCOIl7ce23t8CQfSrtcr_F0MFUc/exec'; 

export const BRAND_ORANGE = '#FF7800';

/* 
===================================================================================
ОБНОВЛЕННЫЙ КОД ДЛЯ GOOGLE APPS SCRIPT (v3.0 - FIX FETCH ERROR)
===================================================================================
Скопируйте этот код полностью в script.google.com, сохраните и сделайте DEPLOY -> NEW VERSION.

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

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Пытаемся получить лок. Если сервер занят более 10 сек, возвращаем JSON ошибку вместо 500 HTML (чтобы не было CORS error)
  if (!lock.tryLock(10000)) {
    return response({ status: 'error', message: 'Server is busy. Please try again.' });
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents;
    if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else {
      return response({ status: 'error', message: 'No data found' });
    }

    if (contents.type === 'order') {
      var sheet = getOrCreateSheet(ss, "Orders");
      var orderId = "SD-" + Math.floor(1000 + Math.random() * 9000); 
      
      var itemsStr = contents.items.map(function(i) { 
        return i.name + (i.option ? " (" + i.option + ")" : "") + " x" + i.quantity; 
      }).join("\n");

      sheet.appendRow([
        new Date(), 
        orderId, 
        "pending", 
        contents.restaurant.name, 
        contents.name, 
        "'"+contents.phone,
        contents.orderType, 
        contents.total, 
        itemsStr, 
        contents.comment, 
        contents.address,
        contents.tgUser ? contents.tgUser.id : "unknown"
      ]);

      try {
        sendOrderToTelegram(contents, orderId, itemsStr);
      } catch (tgError) {
        getOrCreateSheet(ss, "Debug").appendRow([new Date(), "TG Error", tgError.toString()]);
      }
      
      return response({ status: 'success', orderId: orderId });
    }

    if (contents.type === 'registration') {
      var userSheet = getOrCreateSheet(ss, "Users");
      userSheet.appendRow([new Date(), contents.tgUser ? contents.tgUser.id : "", contents.name, contents.phone]);
      return response({ status: 'registered' });
    }

    // Для аналитики
    if (contents.type === 'analytics') {
      var sheet = getOrCreateSheet(ss, "Analytics");
      sheet.appendRow([new Date(), contents.event, JSON.stringify(contents.data), contents.user.id]);
      return response({ status: 'ok' });
    }
    
    return response({ status: 'unknown_type' });

  } catch (error) {
    return response({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000); // Короткий лок для чтения

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ПРОВЕРКА СТАТУСА (polling)
    if (e.parameter.orderId) {
      var sheet = ss.getSheetByName("Orders");
      if (!sheet) return response({ status: 'not_found' });
      
      // Читаем последние 50 строк для скорости, вместо всей таблицы
      var lastRow = sheet.getLastRow();
      var startRow = Math.max(2, lastRow - 50);
      var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 3).getValues(); // Берем 3 колонки: Date, OrderId, Status
      
      // Ищем с конца (новые заказы внизу)
      for (var i = data.length - 1; i >= 0; i--) {
        if (data[i][1] == e.parameter.orderId) { // Column B is OrderId (index 1)
          return response({ status: data[i][2] }); // Column C is Status (index 2)
        }
      }
      return response({ status: 'pending' }); // Если не нашли, считаем pending
    }

    // 2. ИСТОРИЯ ЗАКАЗОВ
    if (e.parameter.historyPhone) {
      var phone = e.parameter.historyPhone.replace(/\D/g, ''); 
      if (phone.length < 5) return response([]);
      
      var sheet = ss.getSheetByName("Orders");
      if (!sheet) return response([]);
      
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return response([]);

      var data = sheet.getRange(2, 1, lastRow - 1, 11).getValues(); // Читаем всё
      var history = [];
      
      // Ищем совпадения по телефону (обратный порядок)
      for (var i = data.length - 1; i >= 0; i--) {
        var rowPhone = String(data[i][5]).replace(/\D/g, ''); // Col F is phone (index 5)
        if (rowPhone.includes(phone) || phone.includes(rowPhone)) {
          history.push({
            date: data[i][0],
            orderId: data[i][1],
            status: data[i][2],
            branch: data[i][3],
            total: data[i][8],
            items: data[i][8], // Bug fix: items is usually index 9, check doPost map
            // Fix mapping based on doPost: 
            // 0:Date, 1:Id, 2:Status, 3:Rest, 4:Name, 5:Phone, 6:Type, 7:Total, 8:Items, 9:Comment
            // Wait, doPost: Date, OrderId, Status, Rest, Name, Phone, Type, Total, Items, Comment, Address...
            // Indices: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
            items: data[i][8],
            comment: data[i][9],
            total: data[i][7]
          });
          if (history.length >= 10) break;
        }
      }
      return response(history);
    }

    return response({ status: 'active', message: 'Script is running v3.0' });
  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function sendOrderToTelegram(order, orderId, itemsStr) {
  var config = BRANCH_CONFIG[order.restaurant.id] || BRANCH_CONFIG["branch_1"];
  
  var message = "🔥 *ЗАКАЗ " + orderId + "*\n" +
                "👤 *" + order.name + "*\n" +
                "📞 " + order.phone + "\n" +
                "📍 " + (order.orderType === 'delivery' ? "ДОСТАВКА" : "САМОВЫВОЗ") + "\n";
  
  if (order.orderType === 'delivery') message += "🏠 " + order.address + "\n";
  if (order.comment) message += "💬 " + order.comment + "\n";
  
  message += "\n🛒 *ЗАКАЗ:*\n" + itemsStr + "\n\n" +
             "💰 *ИТОГО: " + order.total.toLocaleString() + " СУМ*";

  var keyboard = {
    inline_keyboard: [
      [{ text: "👨‍🍳 Готовить", callback_data: "status_cooking_" + orderId }, { text: "✅ Выдан", callback_data: "status_completed_" + orderId }],
      [{ text: "❌ Отмена", callback_data: "status_cancelled_" + orderId }]
    ]
  };

  UrlFetchApp.fetch("https://api.telegram.org/bot" + config.botToken + "/sendMessage", {
    method: "post",
    payload: { chat_id: config.adminChatId, text: message, parse_mode: "Markdown", reply_markup: JSON.stringify(keyboard) }
  });
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
===================================================================================
*/

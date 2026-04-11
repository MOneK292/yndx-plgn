// background.js - Перехват CSRF токенов из HTTP запросов
console.log('🔧 CSRF Token Interceptor Background starting...');

class CsrfTokenInterceptor {
  constructor() {
    this.setupWebRequestListener();
    this.setupMessageListener();
  }

  setupWebRequestListener() {
    // Перехватываем все запросы к API Яндекс.Карт
    chrome.webRequest.onBeforeSendHeaders.addListener(
      (details) => {
        this.interceptHeaders(details);
      },
      { urls: ["https://npro.maps.yandex.ru/*"] },
      ["requestHeaders"]
    );

    // Перехватываем запросы к метрике для извлечения wstoken
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        this.interceptMetricaRequest(details);
      },
      { urls: ["https://mc.yandex.ru/watch/*"] },
      ["requestBody"]
    );
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'foundToken') {
        if (this.isValidToken(message.token)) {
          this.saveToken(message.token);
          sendResponse({ success: true });
        }
      }
      return true;
    });
  }

  interceptHeaders(details) {
    if (!details.requestHeaders) return;

    // Ищем CSRF токен в заголовках
    for (const header of details.requestHeaders) {
      if (header.name.toLowerCase() === 'x-csrf-token' && header.value) {
        const token = header.value;
        
        // Проверяем что это длинный токен (не 123:456)
        if (this.isValidToken(token)) {
          this.saveToken(token);
        }
      }
    }
  }

  interceptMetricaRequest(details) {
    // Извлекаем данные из URL (они в параметрах запроса)
    if (details.url) {
      try {
        const url = new URL(details.url);
        const browserInfo = url.searchParams.get('browser-info');
        
        if (browserInfo) {
          // Ищем wstoken в browser-info
          const wstokenMatch = browserInfo.match(/wstoken:([^:]+:[^:]+:[^:]+:[^:]+)/);
          if (wstokenMatch && wstokenMatch[1]) {
            const token = wstokenMatch[1];
            if (this.isValidToken(token)) {
              console.log('✅ Найден wstoken в метрике:', token.substring(0, 30) + '...');
              this.saveToken(token);
            }
          }
        }
      } catch (e) {
        console.error('Ошибка парсинга URL метрики:', e);
      }
    }

    // Также проверяем тело запроса если есть
    if (details.requestBody && details.requestBody.formData) {
      const formData = details.requestBody.formData;
      
      // Ищем в различных полях
      for (const key in formData) {
        const values = formData[key];
        for (const value of values) {
          try {
            // Пытаемся распарсить как JSON
            const data = JSON.parse(value);
            
            // Ищем wstoken
            if (data.settings && data.settings.wstoken) {
              const token = data.settings.wstoken;
              if (this.isValidToken(token)) {
                console.log('✅ Найден wstoken в formData:', token.substring(0, 30) + '...');
                this.saveToken(token);
              }
            }
          } catch (e) {
            // Не JSON, ищем паттерн токена в строке
            const tokenMatch = value.match(/([a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})/);
            if (tokenMatch && this.isValidToken(tokenMatch[1])) {
              console.log('✅ Найден токен в строке:', tokenMatch[1].substring(0, 30) + '...');
              this.saveToken(tokenMatch[1]);
            }
          }
        }
      }
    }
  }

  isValidToken(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Токен должен быть длинным (больше 30 символов)
    if (token.length < 30) {
      return false;
    }

    // Проверяем формат токена Яндекса
    // Формат 1: xxxx:xxxx:xxxx:xxxx (разделенный двоеточиями)
    const colonParts = token.split(':');
    if (colonParts.length === 4) {
      // Каждая часть должна быть достаточно длинной
      for (const part of colonParts) {
        if (part.length < 5) {
          return false;
        }
      }
      return true;
    }

    // Формат 2: xxxx.xxxx.xxxx (разделенный точками, wstoken)
    const dotParts = token.split('.');
    if (dotParts.length >= 2) {
      // Первая часть должна быть числом (ID)
      if (/^\d+$/.test(dotParts[0])) {
        // Остальные части должны быть длинными
        for (let i = 1; i < dotParts.length; i++) {
          if (dotParts[i].length < 10) {
            return false;
          }
        }
        return true;
      }
    }

    return false;
  }

  async saveToken(token) {
    try {
      // Проверяем, не сохранен ли уже этот токен
      const result = await chrome.storage.local.get(['universalToken']);
      
      if (result.universalToken !== token) {
        await chrome.storage.local.set({ 
          universalToken: token,
          tokenFoundAt: Date.now()
        });
        
        console.log('✅ CSRF токен перехвачен и сохранен:', token.substring(0, 30) + '...');
        
        // Уведомляем popup если он открыт
        chrome.runtime.sendMessage({
          type: 'csrfTokenFound',
          token: token
        }).catch(() => {
          // Popup может быть закрыт
        });
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения токена:', error);
    }
  }
}

// Инициализация
const csrfInterceptor = new CsrfTokenInterceptor();

console.log('✅ CSRF Token Interceptor initialized');

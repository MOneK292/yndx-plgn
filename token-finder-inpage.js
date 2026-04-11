// token-finder-inpage.js - Перехват токенов из fetch/XHR запросов
(function() {
  'use strict';

  console.log('🔧 Token Finder inpage script loaded');

  class TokenFinderInpage {
    constructor() {
      this.seenTokens = new Set();
      this.originalFetch = null;
      this.originalXHR = null;
      this.interceptorsInstalled = false;

      this.init();
    }

    init() {
      this.installInterceptors();
      console.log('📋 Token finder inpage script initialized');
    }

    installInterceptors() {
      if (this.interceptorsInstalled) return;

      this.interceptFetch();
      this.interceptXHR();
      this.interceptorsInstalled = true;

      console.log('🔗 HTTP interceptors installed');
    }

    interceptFetch() {
      if (this.originalFetch) return;

      this.originalFetch = window.fetch;
      const self = this;

      window.fetch = function(resource, config = {}) {
        try {
          self.processFetchRequest(resource, config);
        } catch (error) {
          console.error('❌ Error processing fetch request:', error);
        }

        return self.originalFetch.apply(this, arguments);
      };
    }

    interceptXHR() {
      if (this.originalXHR) return;

      this.originalXHR = window.XMLHttpRequest;
      const self = this;

      function WrappedXHR() {
        const xhr = new self.originalXHR();
        const originalSetRequestHeader = xhr.setRequestHeader;

        xhr.setRequestHeader = function(name, value) {
          try {
            self.processXHRHeader(name, value);
          } catch (error) {
            console.error('❌ Error processing XHR header:', error);
          }

          return originalSetRequestHeader.call(xhr, name, value);
        };

        return xhr;
      }

      WrappedXHR.prototype = this.originalXHR.prototype;
      window.XMLHttpRequest = WrappedXHR;
    }

    processFetchRequest(resource, config) {
      const url = typeof resource === 'string' ? resource : resource.url;

      // Обработка заголовков
      if (config.headers) {
        const headers = new Headers(config.headers);

        // CSRF токены
        const csrfToken = headers.get('X-Csrf-Token') || headers.get('x-csrf-token');
        if (csrfToken) {
          this.sendToken('csrf', csrfToken);
        }

        // Другие токены в заголовках
        for (const [key, value] of headers) {
          if (/token/i.test(key) && value && key.toLowerCase() !== 'x-csrf-token') {
            this.sendToken('token', value);
          }
        }
      }

      // Токены в URL параметрах
      if (url) {
        url.replace(/[?&](?:token|x-csrf-token)=([^&]+)/gi, (match, token) => {
          const decodedToken = decodeURIComponent(token);
          const isCsrf = /csrf/i.test(match);
          this.sendToken(isCsrf ? 'csrf' : 'token', decodedToken);
        });
      }

      // Обработка body для batch запросов
      if (url && url.includes('/api/v2/batch') && typeof config.body === 'string') {
        try {
          const batchData = JSON.parse(config.body);
          if (Array.isArray(batchData)) {
            batchData.forEach(item => {
              if (item.params && item.params.token) {
                this.sendToken('token', item.params.token);
              }
            });
          }
        } catch (error) {
          // Если не JSON, ищем токены регулярным выражением
          const tokenMatches = config.body.match(/[A-Za-z0-9_\-\.]+:[A-Za-z0-9_\-\.]+:[A-Za-z0-9_\-\.]+:[A-Za-z0-9_\-\.]+/g);
          if (tokenMatches) {
            tokenMatches.forEach(token => this.sendToken('token', token));
          }
        }
      }
    }

    processXHRHeader(name, value) {
      if (/^x-?csrf-?token$/i.test(name)) {
        this.sendToken('csrf', value);
      } else if (/token/i.test(name)) {
        this.sendToken('token', value);
      }
    }

    sendToken(type, token) {
      if (!token || typeof token !== 'string') {
        return;
      }

      // Проверяем валидность токена
      if (!this.isValidToken(token)) {
        return;
      }

      // Создаем уникальный ключ для дедупликации
      const key = `${type}:${token}`;

      if (this.seenTokens.has(key)) {
        return; // Уже отправляли этот токен
      }

      this.seenTokens.add(key);

      // Отправляем токен в content script
      window.postMessage({
        direction: 'from-token-finder',
        type: type,
        token: token,
        timestamp: Date.now()
      }, '*');

      console.log(`📤 Token sent: ${type} (${token.substring(0, 20)}...)`);
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

      // Формат 2: длинная строка с буквами и цифрами
      const hasLetters = /[a-zA-Z]/.test(token);
      const hasNumbers = /[0-9]/.test(token);
      
      return hasLetters && hasNumbers;
    }
  }

  // Инициализация inpage скрипта
  const tokenFinderInpage = new TokenFinderInpage();

  // Обработка ошибок
  window.addEventListener('error', (event) => {
    if (event.error) {
      console.error('🚨 Token finder inpage script error:', event.error);
    }
  });

  console.log('✅ Token Finder Inpage Script ready');
})();

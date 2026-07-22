// token-finder-inpage.js - БЕЗОПАСНАЯ ВЕРСИЯ (без перехвата XHR/Fetch)
console.log('🔍 Безопасный Token Finder запущен');

(function() {
  function findAndSendToken() {
    let csrfToken = null;

    // 1. Ищем в глобальных объектах Яндекса (самый надежный способ)
    try {
      if (window.Ya && window.Ya.csrf) {
        csrfToken = window.Ya.csrf;
      } else if (window.csrf) {
        csrfToken = window.csrf;
      }
    } catch (e) {}

    // 2. Ищем в localStorage (Яндекс часто хранит токен там)
    if (!csrfToken) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            // Проверяем формат Яндекса (xxxx:xxxx:xxxx:xxxx)
            if (value && /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(value)) {
              csrfToken = value;
              break;
            }
          }
        }
      } catch (e) {}
    }

    // Если нашли - отправляем в content-script.js
    if (csrfToken) {
      window.postMessage({ 
        direction: 'from-token-finder', 
        type: 'csrf', 
        token: csrfToken 
      }, '*');
    }
  }

  // Запускаем проверку несколько раз при загрузке страницы, 
  // так как переменные могут появиться не сразу
  findAndSendToken();
  setTimeout(findAndSendToken, 1500);
  setTimeout(findAndSendToken, 4000);
  
  // Дополнительно проверяем при кликах (если токен обновился при смене аккаунта/задачи)
  document.addEventListener('click', () => {
    setTimeout(findAndSendToken, 1000);
  }, { passive: true });
})();
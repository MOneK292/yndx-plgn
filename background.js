// background.js - Облегченный фоновый скрипт
console.log('🔧 Background Service Worker starting...');

// Слушаем сообщения с найденными токенами от content-скриптов
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'foundToken') {
    if (isValidToken(message.token)) {
      saveToken(message.token);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Невалидный формат токена' });
    }
  }
  return true;
});

function isValidToken(token) {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 30) return false;

  const colonParts = token.split(':');
  if (colonParts.length === 4) {
    return colonParts.every(part => part.length >= 5);
  }

  const dotParts = token.split('.');
  if (dotParts.length >= 2) {
    if (/^\d+$/.test(dotParts[0])) {
      for (let i = 1; i < dotParts.length; i++) {
        if (dotParts[i].length < 10) return false;
      }
      return true;
    }
  }

  return false;
}

async function saveToken(token) {
  try {
    const result = await chrome.storage.local.get(['universalToken']);
    
    if (result.universalToken !== token) {
      await chrome.storage.local.set({ 
        universalToken: token,
        tokenFoundAt: Date.now()
      });
      
      console.log('✅ CSRF токен сохранен:', token.substring(0, 30) + '...');
      
      // Уведомляем popup, если он открыт
      chrome.runtime.sendMessage({
        type: 'csrfTokenFound',
        token: token
      }).catch(() => {
        // Popup закрыт, игнорируем ошибку
      });
    }
  } catch (error) {
    console.error('❌ Ошибка сохранения токена:', error);
  }
}
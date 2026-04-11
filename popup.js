const STATS_URL = 'https://npro.maps.yandex.ru/api/v2/batch';
const universalTokenInput = document.getElementById('universalToken');
const btnSaveUniversal = document.getElementById('saveUniversalToken');
const btnGetCsrfToken = document.getElementById('getCsrfToken');
const btnFetch = document.getElementById('fetch');
const btnToggleCounter = document.getElementById('toggleCounter');
const toggleCheckbox = document.getElementById('toggleCheckbox');
const btnTogglePlugin = document.getElementById('togglePlugin');
const out = document.getElementById('stats');

class PopupSync {
  constructor() {
    this.done = 0;
    this.pending = 0;
    this.enabled = true;
    this.lastFetchTime = 0;
    this.isFetching = false;
    this.loadData();
    this.setupMessageListener();
    this.setupTokenListener();
  }

  setupTokenListener() {
    // Слушаем сообщения о найденных токенах
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'csrfTokenFound') {
        console.log('✅ CSRF токен перехвачен:', message.token.substring(0, 30) + '...');
        // Обновляем поле ввода если popup открыт
        if (universalTokenInput) {
          universalTokenInput.value = message.token;
          out.textContent = '✅ CSRF токен автоматически найден!';
          setTimeout(() => this.updateDisplay(), 2000);
        }
      }
    });
  }

  loadData() {
    chrome.storage.local.get([
      'taskData', 
      'pluginEnabled',
      'continuousMode'
    ], (result) => {
      if (result.taskData) {
        this.done = result.taskData.done || 0;
        this.pending = result.taskData.pending || 0;
      }
      this.enabled = result.pluginEnabled !== false;
      // Загружаем состояние непрерывного режима
      if (result.continuousMode !== undefined) {
        this.updateCheckboxState('toggleCheckbox', result.continuousMode);
      }
      this.updateDisplay();
      this.updatePluginButton();
      this.updateCheckboxes();
    });
    // Слушаем изменения storage
    chrome.storage.onChanged.addListener((changes) => {
      console.log('Storage changed:', changes);
      if (changes.taskData) {
        const data = changes.taskData.newValue;
        this.done = data.done || 0;
        this.pending = data.pending || 0;
        this.updateDisplay();
      }
      if (changes.pluginEnabled) {
        this.enabled = changes.pluginEnabled.newValue !== false;
        this.updatePluginButton();
        this.updateCheckboxes();
      }
      // Синхронизация непрерывного режима
      if (changes.continuousMode) {
        this.updateCheckboxState('toggleCheckbox', changes.continuousMode.newValue);
      }
    });
  }

  // Универсальный метод обновления чекбоксов
  updateCheckboxState(checkboxId, state) {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox && checkbox.checked !== state) {
      checkbox.checked = state;
    }
  }

  updateCheckboxes() {
    // Обновляем состояние чекбоксов на основе текущих настроек
    if (toggleCheckbox) {
      toggleCheckbox.disabled = !this.enabled;
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'triggerFetch' || message.action === 'updateStatsFromButton') {
        setTimeout(() => this.fetchStatsFromAPI(), 2000);
      }
      // НОВЫЙ ОБРАБОТЧИК: для Alt+N
      if (message.action === 'triggerFetchFromHotkey') {
        console.log('Triggering fetch from Alt+N hotkey...');
        this.fetchStatsFromAPI();
        return true;
      }
    });
  }

  saveData() {
    const data = { done: this.done, pending: this.pending };
    chrome.storage.local.set({ 
      taskData: data, 
      pluginEnabled: this.enabled
    });
  }

  updateDisplay() {
    if (!this.enabled) {
      out.textContent = '🔴 Плагин отключен';
      return;
    }
    out.textContent = `✅ Выполнено: ${this.done}\n⏳ В очереди: ${this.pending}`;
  }

  updatePluginButton() {
    if (btnTogglePlugin) {
      btnTogglePlugin.textContent = this.enabled ? 'Отключить плагин' : 'Включить плагин';
      btnTogglePlugin.className = this.enabled ? 'btn-danger' : 'btn-success';
    }
  }

  updateData(newData) {
    this.done = newData.done || 0;
    this.pending = newData.pending || 0;
    this.saveData();
    this.updateDisplay();
    this.syncWithContent();
  }

  async fetchStatsFromAPI() {
    if (!this.enabled) {
      out.textContent = 'Плагин отключен';
      return;
    }
    const now = Date.now();
    if (now - this.lastFetchTime < 10000) {
      out.textContent = 'Слишком частый запрос\nПопробуйте через 10 сек';
      return;
    }
    if (this.isFetching) {
      out.textContent = 'Запрос уже выполняется...';
      return;
    }
    const universalToken = universalTokenInput.value.trim();
    if (!universalToken) {
      out.textContent = 'Нужен токен';
      return;
    }
    this.isFetching = true;
    this.lastFetchTime = now;
    out.textContent = 'Загрузка... 🔄';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(STATS_URL, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'X-Csrf-Token': universalToken,
          'X-Lang': 'ru'
        },
        body: JSON.stringify([{
          method: 'autoManager/getUserStats',
          params: { tz: -180, token: universalToken }
        }])
      });
      clearTimeout(timeoutId);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const stats = json.data?.[0]?.data?.statistics?.[0] || {};
      this.updateData({
        done: stats.doneToday?.base || 0,
        pending: stats.targeted?.base || 0
      });
      out.textContent = '✅ Данные обновлены';
    } catch (e) {
      if (e.name === 'AbortError') {
        out.textContent = '⏰ Таймаут запроса';
      } else {
        out.textContent = `❌ Ошибка: ${e.message}`;
      }
    } finally {
      this.isFetching = false;
      setTimeout(() => this.updateDisplay(), 2000);
    }
  }

  async syncWithContent() {
    if (!this.enabled) return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateTaskData',
        data: { done: this.done, pending: this.pending }
      });
    } catch (e) {}
  }

  async getFromContent() {
    if (!this.enabled) return null;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: 'getTaskData' }, (response) => {
          if (response?.success) {
            this.done = response.data.done;
            this.pending = response.data.pending;
            this.saveData();
            this.updateDisplay();
            resolve(response.data);
          } else {
            resolve(null);
          }
        });
      });
    } catch (e) {
      return null;
    }
  }
}

const popupSync = new PopupSync();

// Загрузка токена
chrome.storage.local.get(['universalToken'], ({ universalToken }) => {
  if (universalToken) universalTokenInput.value = universalToken;
});

// Сохранение токена
btnSaveUniversal.addEventListener('click', () => {
  const val = universalTokenInput.value.trim();
  if (!val) {
    out.textContent = 'Введите токен';
    return;
  }
  chrome.storage.local.set({ universalToken: val }, () => {
    out.textContent = 'Токен сохранён ✔';
    setTimeout(() => popupSync.updateDisplay(), 1000);
  });
});

// Получение CSRF токена из storage или со страницы
btnGetCsrfToken.addEventListener('click', async () => {
  out.textContent = 'Поиск CSRF токена... 🔍';
  
  try {
    // Сначала проверяем storage
    chrome.storage.local.get(['universalToken'], async ({ universalToken }) => {
      if (universalToken) {
        // Токен найден в storage - вставляем в поле и копируем
        universalTokenInput.value = universalToken;
        
        try {
          await navigator.clipboard.writeText(universalToken);
          out.textContent = '✅ CSRF токен скопирован!\n' + universalToken.substring(0, 30) + '...';
          setTimeout(() => popupSync.updateDisplay(), 2000);
        } catch (err) {
          // Fallback
          const textArea = document.createElement('textarea');
          textArea.value = universalToken;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          out.textContent = '✅ CSRF токен скопирован!\n' + universalToken.substring(0, 30) + '...';
          setTimeout(() => popupSync.updateDisplay(), 2000);
        }
      } else {
        // Токена нет в storage - ищем на странице
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            let csrfToken = null;
            
            // 1. Ищем в localStorage (где Яндекс хранит токен)
            try {
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                  const value = localStorage.getItem(key);
                  // Токен Яндекса имеет формат: xxxx:xxxx:xxxx:xxxx
                  if (value && /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(value)) {
                    csrfToken = value;
                    break;
                  }
                }
              }
            } catch (e) {}
            
            // 2. Ищем в глобальных переменных window
            if (!csrfToken) {
              try {
                if (window.Ya && window.Ya.csrf) {
                  csrfToken = window.Ya.csrf;
                } else if (window.csrf) {
                  csrfToken = window.csrf;
                }
              } catch (e) {}
            }
            
            // 3. Ищем в meta тегах
            if (!csrfToken) {
              const metaTag = document.querySelector('meta[name="csrf-token"]') || 
                             document.querySelector('meta[name="x-csrf-token"]');
              if (metaTag) {
                csrfToken = metaTag.getAttribute('content');
              }
            }
            
            // 4. Ищем в cookies
            if (!csrfToken) {
              const cookies = document.cookie.split(';');
              for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name && (name.toLowerCase().includes('csrf') || name.toLowerCase().includes('token'))) {
                  const decoded = decodeURIComponent(value);
                  if (decoded.length > 20) {
                    csrfToken = decoded;
                    break;
                  }
                }
              }
            }
            
            return csrfToken;
          }
        }, async (results) => {
          if (chrome.runtime.lastError) {
            out.textContent = '❌ Ошибка: ' + chrome.runtime.lastError.message;
            setTimeout(() => popupSync.updateDisplay(), 2000);
            return;
          }
          
          const csrfToken = results[0]?.result;
          
          if (csrfToken) {
            // Вставляем токен в поле ввода
            universalTokenInput.value = csrfToken;
            
            // Сохраняем найденный токен
            chrome.storage.local.set({ universalToken: csrfToken }, async () => {
              try {
                await navigator.clipboard.writeText(csrfToken);
                out.textContent = '✅ CSRF токен найден и скопирован!\n' + csrfToken.substring(0, 30) + '...';
              } catch (err) {
                out.textContent = '✅ CSRF токен найден и вставлен!\n' + csrfToken.substring(0, 30) + '...';
              }
              
              setTimeout(() => popupSync.updateDisplay(), 2000);
            });
          } else {
            out.textContent = '❌ CSRF токен не найден\nПопробуйте перезагрузить страницу\nили введите вручную';
            setTimeout(() => popupSync.updateDisplay(), 3000);
          }
        });
      }
    });
  } catch (e) {
    out.textContent = '❌ Ошибка: ' + e.message;
    setTimeout(() => popupSync.updateDisplay(), 2000);
  }
});

// Переключение плагина
btnTogglePlugin.addEventListener('click', async () => {
  popupSync.enabled = !popupSync.enabled;
  popupSync.saveData();
  popupSync.updateDisplay();
  popupSync.updatePluginButton();
  popupSync.updateCheckboxes();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, {
      action: 'setPluginEnabled',
      enabled: popupSync.enabled
    });
  } catch (e) {}
  out.textContent = popupSync.enabled ? 'Плагин включен ✔' : 'Плагин отключен';
  setTimeout(() => popupSync.updateDisplay(), 1000);
});

// Получение статистики
btnFetch.addEventListener('click', async () => {
  popupSync.fetchStatsFromAPI();
});

// Переключение видимости счетчика
btnToggleCounter.addEventListener('click', async () => {
  if (!popupSync.enabled) {
    out.textContent = 'Плагин отключен';
    return;
  }
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.storage.local.get(['counterVisible'], ({ counterVisible }) => {
      const newVisible = !(counterVisible !== false);
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleCounter',
        visible: newVisible
      }, (response) => {
        if (chrome.runtime.lastError) {
          chrome.storage.local.set({ counterVisible: newVisible }, () => {
            btnToggleCounter.textContent = newVisible ? 'Скрыть счетчик' : 'Показать счетчик';
            out.textContent = newVisible ? 'Счетчик показан' : 'Счетчик скрыт';
            setTimeout(() => popupSync.updateDisplay(), 1000);
          });
        } else if (response?.success) {
          btnToggleCounter.textContent = response.visible ? 'Скрыть счетчик' : 'Показать счетчик';
          out.textContent = response.visible ? 'Счетчик показан' : 'Счетчик скрыт';
          setTimeout(() => popupSync.updateDisplay(), 1000);
        }
      });
    });
  } catch (e) {
    out.textContent = 'Ошибка переключения';
  }
});

// Синхронизация состояния при открытии popup
(async function syncState() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Загружаем актуальные настройки при открытии popup
    chrome.storage.local.get([
      'continuousMode',
      'counterVisible'
    ], (result) => {
      // Обновляем чекбокс непрерывного режима
      if (toggleCheckbox && result.continuousMode !== undefined) {
        toggleCheckbox.checked = result.continuousMode;
      }
      // Обновляем кнопку счетчика
      if (btnToggleCounter) {
        btnToggleCounter.textContent = (result.counterVisible !== false) ? 'Скрыть счетчик' : 'Показать счетчик';
      }
    });
    if (popupSync.enabled) {
      setTimeout(() => popupSync.getFromContent(), 1000);
    }
  } catch (e) {
    console.error('Sync error:', e);
  }
})();

// Обработка чекбокса непрерывной выдачи
toggleCheckbox.addEventListener('change', async () => {
  if (!popupSync.enabled) {
    out.textContent = 'Плагин отключен';
    toggleCheckbox.checked = !toggleCheckbox.checked;
    return;
  }
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Сохраняем состояние в storage для синхронизации
    chrome.storage.local.set({ continuousMode: toggleCheckbox.checked });
    chrome.tabs.sendMessage(tab.id, {
      action: 'setContinuousState',
      checked: toggleCheckbox.checked
    }, resp => {
      if (resp?.success) {
        out.textContent = toggleCheckbox.checked ? 'Непрерывная выдача включена' : 'Непрерывная выдача отключена';
        setTimeout(() => popupSync.updateDisplay(), 1000);
      } else {
        out.textContent = 'Ошибка переключения режима';
        toggleCheckbox.checked = !toggleCheckbox.checked; // Откатываем изменение
      }
    });
  } catch (e) {
    out.textContent = 'Ошибка переключения режима';
    toggleCheckbox.checked = !toggleCheckbox.checked; // Откатываем изменение
  }
});

// Поиск чекбокса непрерывной выдачи
function findContinuousCheckbox() {
  const labels = Array.from(document.querySelectorAll('.nk-checkbox__text'));
  const target = labels.find(l => l.textContent.includes('Режим непрерывной выдачи заданий'));
  if (!target) return null;
  const labelEl = target.closest('label');
  const cb = labelEl.querySelector('input[type="checkbox"]');
  return { labelEl, cb };
}

// Счетчик задач слева от кнопки настроек с высоким z-index
class TaskCounterLeftOfSettings {
  constructor() {
    this.counterElement = null;
    this.done = 0;
    this.pending = 0;
    this.isVisible = true;
    this.continuousMode = false;
    this.enabled = true;
    this.isFetching = false;
    this.lastFetchTime = 0;
    this.cacheCleanInterval = null;
    this.init();
  }

  init() {
    // Загружаем ВСЕ настройки сразу
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([
        'pluginEnabled',
        'continuousMode',
        'counterVisible'
      ], (result) => {
        this.enabled = result.pluginEnabled !== false;
        this.continuousMode = result.continuousMode !== false;
        this.isVisible = result.counterVisible !== false;
        if (!this.enabled) {
          console.log('[Plugin] Disabled');
          return;
        }
        setTimeout(() => {
          this.loadData();
          this.createCounterLeftOfSettings();
          this.setupAutoRefresh();
          this.setupCacheCleaner();
          this.checkContinuousState();
        }, 1000);
      });
    } else {
      setTimeout(() => {
        this.loadData();
        this.createCounterLeftOfSettings();
        this.setupAutoRefresh();
        this.setupCacheCleaner();
        this.checkContinuousState();
      }, 1000);
    }
    // Слушаем ВСЕ изменения storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes) => {
        console.log('[Plugin] Storage changed:', changes);
        if (changes.pluginEnabled) {
          this.enabled = changes.pluginEnabled.newValue !== false;
          if (this.enabled) {
            this.enable();
          } else {
            this.disable();
          }
        }
        if (changes.continuousMode) {
          this.continuousMode = changes.continuousMode.newValue;
          this.updateContinuousCheckbox();
          this.syncContinuousMode();
        }
        if (changes.counterVisible !== undefined) {
          this.isVisible = changes.counterVisible.newValue !== false;
          this.updateDisplay();
        }
      });
    }
  }

  // Очистка кеша каждые 5 минут
  setupCacheCleaner() {
    if (this.cacheCleanInterval) {
      clearInterval(this.cacheCleanInterval);
    }
    this.cacheCleanInterval = setInterval(() => {
      if (this.enabled) {
        console.log('[Plugin] Cleaning cache...');
        if (window.caches) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        if (window.gc) window.gc();
      }
    }, 5 * 60 * 1000);
  }

  // Загрузка данных статистики
  loadData() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['taskData'], (result) => {
          if (result.taskData) {
            this.done = result.taskData.done || 0;
            this.pending = result.taskData.pending || 0;
          }
          this.updateDisplay();
        });
      } else {
        const cached = localStorage.getItem('taskData');
        if (cached) {
          const data = JSON.parse(cached);
          this.done = data.done || 0;
          this.pending = data.pending || 0;
          this.updateDisplay();
        }
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }

  // Сохранение данных
  saveData() {
    const data = { done: this.done, pending: this.pending };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ 
          taskData: data, 
          counterVisible: this.isVisible
        });
      } else {
        localStorage.setItem('taskData', JSON.stringify(data));
      }
    } catch (e) {
      localStorage.setItem('taskData', JSON.stringify(data));
    }
  }

  // Создание счетчика
  createCounterLeftOfSettings() {
    const existing = document.getElementById('task-counter-header');
    if (existing) existing.remove();
    const feedbackControl = document.querySelector('.nk-feedback-control-view');
    if (!feedbackControl) {
      setTimeout(() => this.createCounterLeftOfSettings(), 1000);
      return;
    }
    this.counterElement = document.createElement('div');
    this.counterElement.id = 'task-counter-header';
    this.counterElement.className = 'nk-feedback-control-view';
    this.counterElement.style.cssText = `
      display: ${this.isVisible ? 'flex' : 'none'};
      align-items: center;
      font-family: 'Yandex Sans Text', Arial, Helvetica, sans-serif;
      z-index: 9;
      max-height: 38px;
      position: relative;
    `;
    const buttonElement = document.createElement('button');
    buttonElement.className = 'nk-button nk-button_theme_air nk-button_size_xl';
    buttonElement.type = 'button';
    buttonElement.style.cssText = `
      background: none;
      border: none;
      color: #bfbfbf;
      font-size: 14px;
      padding: 0 12px;
      height: 38px;
      cursor: default;
    `;
    buttonElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px; height: 100%; z-index: 9;">
        <div style="display: flex; align-items: center; gap: 4px; z-index: 9;">
          <span id="done-counter" style="color: #4CAF50; font-weight: 700; font-size: 14px; z-index: 9;">${this.done}</span>
          <span style="color: #666; font-size: 12px; z-index: 9;">/</span>
          <span id="pending-counter" style="color: #FF9800; font-weight: 700; font-size: 14px; z-index: 9;">${this.pending}</span>
        </div>
        <div style="width: 1px; height: 20px; background: #444; margin: 0 4px; z-index: 9;"></div>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 11px; z-index: 9;">
          <input type="checkbox" id="continuous-toggle-header" ${this.continuousMode ? 'checked' : ''} 
                 style="margin: 0; transform: scale(0.9); accent-color: #4da6ff; z-index: 9;">
          <span style="font-weight: 600; color: #bfbfbf; z-index: 9;">НВ</span>
        </label>
      </div>
    `;
    this.counterElement.appendChild(buttonElement);
    feedbackControl.parentNode.insertBefore(this.counterElement, feedbackControl);
    this.setupCounterEvents();
    console.log('[Plugin] Counter created successfully');
  }

  setupCounterEvents() {
    const continuousToggle = document.getElementById('continuous-toggle-header');
    if (continuousToggle) {
      continuousToggle.addEventListener('change', (e) => {
        e.stopPropagation();
        this.continuousMode = continuousToggle.checked;
        // Сохраняем в storage для синхронизации
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ continuousMode: this.continuousMode });
        }
        this.toggleContinuousMode(this.continuousMode);
      });
    }
    const button = this.counterElement.querySelector('button');
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }
  }

  // Обновление чекбокса непрерывного режима
  updateContinuousCheckbox() {
    const continuousToggle = document.getElementById('continuous-toggle-header');
    if (continuousToggle && continuousToggle.checked !== this.continuousMode) {
      continuousToggle.checked = this.continuousMode;
    }
  }

  // Синхронизация непрерывного режима с реальным чекбоксом
  syncContinuousMode() {
    const found = findContinuousCheckbox();
    if (found && found.cb.checked !== this.continuousMode) {
      found.labelEl.click();
    }
  }

  toggleContinuousMode(enabled) {
    this.continuousMode = enabled;
    const found = findContinuousCheckbox();
    if (found && found.cb.checked !== enabled) {
      found.labelEl.click();
    }
  }

  checkContinuousState() {
    const found = findContinuousCheckbox();
    if (found) {
      this.continuousMode = found.cb.checked;
      this.updateContinuousCheckbox();
      // Сохраняем актуальное состояние
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ continuousMode: this.continuousMode });
      }
    }
  }

  updateDisplay() {
    if (!this.counterElement) return;
    const doneSpan = document.getElementById('done-counter');
    const pendingSpan = document.getElementById('pending-counter');
    if (doneSpan) doneSpan.textContent = this.done;
    if (pendingSpan) pendingSpan.textContent = this.pending;
    this.counterElement.style.display = this.isVisible ? 'flex' : 'none';
  }

  // API запрос для получения статистики
  async fetchStatsDirectly() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastFetchTime < 10000) {
      console.log('[Plugin] Слишком частый запрос, пропускаем');
      return;
    }
    if (this.isFetching) {
      console.log('[Plugin] Запрос уже выполняется, пропускаем');
      return;
    }
    this.isFetching = true;
    this.lastFetchTime = now;
    try {
      let token;
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['universalToken']);
        token = result.universalToken;
      } else {
        token = localStorage.getItem('universalToken');
      }
      if (!token) {
        console.log('[Plugin] Токен не найден');
        this.isFetching = false;
        return;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://npro.maps.yandex.ru/api/v2/batch', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'X-Csrf-Token': token,
          'X-Lang': 'ru'
        },
        body: JSON.stringify([{
          method: 'autoManager/getUserStats',
          params: { tz: -180, token: token }
        }])
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        console.log('[Plugin] Ошибка HTTP:', response.status);
        this.isFetching = false;
        return;
      }
      const json = await response.json();
      const stats = json.data?.[0]?.data?.statistics?.[0] || {};
      const newData = {
        done: stats.doneToday?.base || 0,
        pending: stats.targeted?.base || 0
      };
      this.done = newData.done;
      this.pending = newData.pending;
      this.saveData();
      this.updateDisplay();
      console.log('[Plugin] Статистика обновлена:', newData);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[Plugin] Ошибка запроса:', error);
      } else {
        console.log('[Plugin] Таймаут запроса');
      }
    } finally {
      this.isFetching = false;
    }
  }

  // УБРАНО: attachButtonListeners и findAndAttachButtons
  setupAutoRefresh() {
    if (!this.enabled) return;
    // УБРАНО: автообновление каждые 15 минут
    // Оставляем только первоначальную загрузку
    setTimeout(() => this.fetchStatsDirectly(), 3000);
  }

  refresh() {
    if (this.enabled) this.fetchStatsDirectly();
  }

  getData() {
    return { done: this.done, pending: this.pending };
  }

  updateData(data) {
    this.done = data.done || 0;
    this.pending = data.pending || 0;
    this.saveData();
    this.updateDisplay();
  }

  show() {
    this.isVisible = true;
    if (this.counterElement) {
      this.counterElement.style.display = 'flex';
    }
    this.saveData();
  }

  hide() {
    this.isVisible = false;
    if (this.counterElement) {
      this.counterElement.style.display = 'none';
    }
    this.saveData();
  }

  toggleVisibility(visible) {
    if (visible !== undefined) {
      this.isVisible = visible;
    } else {
      this.isVisible = !this.isVisible;
    }
    if (this.counterElement) {
      this.counterElement.style.display = this.isVisible ? 'flex' : 'none';
    }
    this.saveData();
    return this.isVisible;
  }

  disable() {
    this.enabled = false;
    if (this.counterElement) {
      this.counterElement.style.display = 'none';
    }
    if (this.cacheCleanInterval) {
      clearInterval(this.cacheCleanInterval);
    }
  }

  enable() {
    this.enabled = true;
    if (this.counterElement) {
      this.counterElement.style.display = this.isVisible ? 'flex' : 'none';
    } else {
      this.init();
    }
    this.setupCacheCleaner();
  }
}

let taskCounter = null;
function initTaskCounter() {
  if (!window.location.href.includes('npro.maps.yandex.ru')) return;
  if (taskCounter) {
    taskCounter = null;
  }
  taskCounter = new TaskCounterLeftOfSettings();
  window.taskCounter = taskCounter;
}

// Инжектим inpage скрипт для перехвата токенов
function injectTokenFinderScript() {
  console.log('[TokenFinder] Начало инжекции inpage скрипта...');
  
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('token-finder-inpage.js');
  script.onload = () => {
    console.log('[TokenFinder] ✅ Inpage скрипт успешно загружен');
    script.remove();
  };
  script.onerror = (error) => {
    console.error('[TokenFinder] ❌ Ошибка загрузки inpage скрипта:', error);
  };
  
  (document.head || document.documentElement).appendChild(script);
  console.log('[TokenFinder] Скрипт добавлен в DOM');
}

// Слушаем сообщения от inpage скрипта
window.addEventListener('message', (event) => {
  if (event.source !== window || event.data.direction !== 'from-token-finder') {
    return;
  }

  const { type, token } = event.data;

  if (!type || !token) {
    console.warn('[TokenFinder] Получено невалидное сообщение:', event.data);
    return;
  }

  console.log('[TokenFinder] 📥 Content получил токен:', type, token.substring(0, 30) + '...');

  // Сохраняем токен в storage
  chrome.storage.local.set({ 
    universalToken: token,
    tokenFoundAt: Date.now()
  }, () => {
    console.log('[TokenFinder] ✅ Токен сохранен в storage');
  });

  // Отправляем в background script
  chrome.runtime.sendMessage({
    action: 'foundToken',
    token: token,
    type: type
  }).then(() => {
    console.log('[TokenFinder] ✅ Токен отправлен в background');
  }).catch((error) => {
    console.log('[TokenFinder] Background недоступен:', error.message);
  });
});

// Инжектим скрипт при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectTokenFinderScript, 500);
  });
} else {
  setTimeout(injectTokenFinderScript, 500);
}

// Обработка сообщений от popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('[Plugin] Message received:', msg.action);
    if (msg.action === 'setPluginEnabled') {
      if (taskCounter) {
        if (msg.enabled) {
          taskCounter.enable();
        } else {
          taskCounter.disable();
        }
      }
      sendResponse({ success: true });
      return true;
    }
    if (msg.action === 'getContinuousState') {
      const found = findContinuousCheckbox();
      sendResponse({ found: !!found, checked: found?.cb.checked });
    }
    if (msg.action === 'setContinuousState') {
      const found = findContinuousCheckbox();
      if (!found) return sendResponse({ success: false, error: 'not_found' });
      const { labelEl, cb } = found;
      if (cb.checked !== msg.checked) {
        labelEl.click();
      }
      setTimeout(() => sendResponse({ success: true, checked: cb.checked }), 100);
      return true;
    }
    if (msg.action === 'getTaskData') {
      if (taskCounter) {
        sendResponse({ success: true, data: taskCounter.getData() });
      } else {
        sendResponse({ success: false, error: 'not_initialized' });
      }
    }
    if (msg.action === 'updateTaskData') {
      if (taskCounter && msg.data) {
        taskCounter.updateData(msg.data);
        sendResponse({ success: true, data: taskCounter.getData() });
      } else {
        sendResponse({ success: false, error: 'not_initialized' });
      }
    }
    if (msg.action === 'refreshCounter') {
      if (taskCounter) {
        taskCounter.refresh();
        sendResponse({ success: true, data: taskCounter.getData() });
      } else {
        initTaskCounter();
        sendResponse({ success: true });
      }
    }
    if (msg.action === 'toggleCounter') {
      if (taskCounter) {
        const newVisible = taskCounter.toggleVisibility(msg.visible);
        sendResponse({ success: true, visible: newVisible });
      } else {
        sendResponse({ success: false, error: 'not_initialized' });
      }
      return true;
    }
  });
}

// Оптимизированная инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initTaskCounter, 2000));
} else {
  setTimeout(initTaskCounter, 2000);
}

// Облегченное наблюдение за URL
let lastUrl = location.href;
let urlCheckTimeout;
let urlCheckLastRun = 0;
const URL_CHECK_MIN_INTERVAL = 2000; // Минимум 2 секунды между срабатываниями
const URL_CHECK_DEBOUNCE = 5000; // Debounce 5 секунд
let urlCheckPending = false;

const urlObserver = new MutationObserver((mutations) => {
  // Жесткое ограничение - не чаще 1 раза в 2 секунды
  const now = Date.now();
  const timeSinceLastRun = now - urlCheckLastRun;
  
  if (timeSinceLastRun < URL_CHECK_MIN_INTERVAL) {
    return; // Пропускаем если слишком рано
  }
  
  // Если уже запланирован запуск, не планируем новый
  if (urlCheckPending) {
    return;
  }
  
  // Проверяем только если есть релевантные изменения
  const hasRelevantChanges = mutations.some(mutation => {
    if (mutation.type !== 'childList') return false;
    
    return Array.from(mutation.addedNodes).some(node => {
      if (node.nodeType !== 1) return false;
      // Проверяем только основные контейнеры
      return node.classList?.contains('nk-app') ||
             node.classList?.contains('nk-main-view') ||
             node.id === 'app';
    });
  });
  
  if (!hasRelevantChanges) {
    return;
  }
  
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    urlCheckPending = true;
    clearTimeout(urlCheckTimeout);
    urlCheckTimeout = setTimeout(() => {
      urlCheckLastRun = Date.now();
      urlCheckPending = false;
      initTaskCounter();
    }, URL_CHECK_DEBOUNCE);
  }
});

// Наблюдаем только за основным контейнером, не за всем document
setTimeout(() => {
  const appContainer = document.getElementById('app') || document.querySelector('.nk-app') || document.body;
  urlObserver.observe(appContainer, { 
    subtree: false, // Только прямые дети
    childList: true,
    attributes: false,
    characterData: false
  });
}, 2000);

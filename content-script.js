// content-script.js - Оптимизированный скрипт интеграции

// --- 1. УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Имитация настоящего клика (для обхода React/Vue)
function simulateRealClick(element) {
  if (!element) return;
  ['mousedown', 'mouseup', 'click'].forEach(eventType => {
    element.dispatchEvent(new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true,
      buttons: 1
    }));
  });
}

// Надежный поиск чекбокса НВ
function findContinuousCheckbox() {
  const labels = Array.from(document.querySelectorAll('.nk-checkbox, label'));
  const target = labels.find(l => l.textContent.toLowerCase().includes('непрерывной выдачи'));
  
  if (!target) return null;
  
  const cb = target.querySelector('input[type="checkbox"]') || 
             target.closest('.nk-checkbox')?.querySelector('input[type="checkbox"]');
  const clickableEl = target.closest('.nk-checkbox') || target;
  
  return cb ? { clickableEl, cb } : null;
}

// Сбор статистики прямо с экрана (ИСПРАВЛЕНО СКЛЕИВАНИЕ ЦИФР)
function scrapeStatsFromScreen() {
  const stats = { basic: 0, eval: 0, pending: 0, money: 0 };
  const rows = document.querySelectorAll('.nk-user-tasks-auto-manager-view__tasks-stats-row');
  
  rows.forEach(row => {
    // Читаем ТОЛЬКО оригинальный текстовый узел Яндекса, 
    // чтобы "166" и "498" не склеивались в "166498"
    let originalText = '';
    for (let node of row.childNodes) {
      if (node.nodeType === 3) { // Узел с текстом
        originalText += node.textContent.toLowerCase();
      }
    }
    
    const countMatch = originalText.match(/:\s*(\d+)/);
    if (countMatch) {
      const count = parseInt(countMatch[1], 10);
      if (originalText.includes('базов')) stats.basic += count;
      if (originalText.includes('провер')) stats.eval += count;
      if (originalText.includes('ожида')) stats.pending += count;
    }
    
    // Рубли парсим строго из нашего добавленного спана
    const moneySpan = row.querySelector('.nk-money-span');
    if (moneySpan) {
      const moneyMatch = moneySpan.textContent.match(/(\d+)\s*₽/);
      if (moneyMatch) {
        stats.money += parseInt(moneyMatch[1], 10);
      }
    }
  });
  
  return stats;
}


// --- 2. КЛАСС СЧЕТЧИКА В ШАПКЕ ---

class TaskCounterLeftOfSettings {
  constructor() {
    this.counterElement = null;
    this.stats = { basic: 0, eval: 0, pending: 0, money: 0 };
    this.isVisible = true;
    this.continuousMode = false;
    this.enabled = true;
    this.syncInterval = null;
    this.init();
  }

  init() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['pluginEnabled', 'continuousMode', 'counterVisible'], (result) => {
        this.enabled = result.pluginEnabled !== false;
        this.continuousMode = result.continuousMode !== false;
        this.isVisible = result.counterVisible !== false;
        
        if (!this.enabled) return;
        
        setTimeout(() => {
          this.createCounterLeftOfSettings();
          this.checkContinuousState();
          
          // Единый интервал для обновления данных
          if (this.syncInterval) clearInterval(this.syncInterval);
          this.syncInterval = setInterval(() => {
            this.updateStatsFromSidebar();
            this.checkContinuousState();
          }, 2000);
        }, 1000);
      });
    }
  }

  updateStatsFromSidebar() {
    if (!this.enabled) return;
    const newStats = scrapeStatsFromScreen();

    // Обновляем UI только если данные изменились
    if (JSON.stringify(this.stats) !== JSON.stringify(newStats)) {
      this.stats = newStats;
      requestAnimationFrame(() => this.updateDisplay());
    }
  }

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
    this.counterElement.style.cssText = `display: ${this.isVisible ? 'flex' : 'none'}; align-items: center; font-family: 'Yandex Sans Text', Arial, sans-serif; z-index: 9; max-height: 38px; position: relative;`;

    const buttonElement = document.createElement('button');
    buttonElement.className = 'nk-button nk-button_theme_air nk-button_size_xl';
    buttonElement.type = 'button';
    buttonElement.style.cssText = `background: none; border: none; color: #bfbfbf; font-size: 14px; padding: 0 12px; height: 38px; cursor: default;`;
    
    buttonElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px; height: 100%; z-index: 9;">
        <div style="display: flex; align-items: center; gap: 4px; z-index: 9;">
          <span id="stat-basic-header" title="Базовые" style="color: #4CAF50; font-weight: 700; font-size: 14px;">${this.stats.basic}</span>
          <span style="color: #666; font-size: 12px;">/</span>
          <span id="stat-eval-header" title="Проверки" style="color: #03A9F4; font-weight: 700; font-size: 14px;">${this.stats.eval}</span>
          <span style="color: #666; font-size: 12px;">/</span>
          <span id="stat-pending-header" title="Ожидается" style="color: #FF9800; font-weight: 700; font-size: 14px;">${this.stats.pending}</span>
          <span style="color: #444; font-size: 12px; margin: 0 4px;">|</span>
          <span id="stat-money-header" title="Заработок" style="color: #FFC107; font-weight: 700; font-size: 14px;">${this.stats.money} ₽</span>
        </div>
        <div style="width: 1px; height: 20px; background: #444; margin: 0 4px; z-index: 9;"></div>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 11px; z-index: 9;">
          <input type="checkbox" id="continuous-toggle-header" ${this.continuousMode ? 'checked' : ''} style="margin: 0; transform: scale(0.9); accent-color: #4da6ff;">
          <span style="font-weight: 600; color: #bfbfbf;">НВ</span>
        </label>
      </div>
    `;

    this.counterElement.appendChild(buttonElement);
    feedbackControl.parentNode.insertBefore(this.counterElement, feedbackControl);
    
    this.setupCounterEvents();
  }

  setupCounterEvents() {
    const continuousToggle = document.getElementById('continuous-toggle-header');
    if (continuousToggle) {
      continuousToggle.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleContinuousMode(continuousToggle.checked);
      });
    }
  }

  updateDisplay() {
    if (!this.counterElement) return;
    
    const elements = {
      'stat-basic-header': this.stats.basic,
      'stat-eval-header': this.stats.eval,
      'stat-pending-header': this.stats.pending,
      'stat-money-header': `${this.stats.money} ₽`
    };

    for (const [id, value] of Object.entries(elements)) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }
  }

  toggleContinuousMode(enabled) {
    this.continuousMode = enabled;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ continuousMode: this.continuousMode });
    }

    const found = findContinuousCheckbox();
    if (found && found.cb.checked !== enabled) {
      simulateRealClick(found.clickableEl);
    }
  }

  checkContinuousState() {
    const found = findContinuousCheckbox();
    if (found) {
      this.continuousMode = found.cb.checked;
      const headerCb = document.getElementById('continuous-toggle-header');
      if (headerCb && headerCb.checked !== this.continuousMode) {
        headerCb.checked = this.continuousMode;
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ continuousMode: this.continuousMode });
        }
      }
    }
  }

  toggleVisibility(visible) {
    this.isVisible = visible;
    if (this.counterElement) {
      this.counterElement.style.display = visible ? 'flex' : 'none';
    }
    return visible;
  }

  enable() {
    this.enabled = true;
    this.init();
  }

  disable() {
    this.enabled = false;
    if (this.counterElement) this.counterElement.remove();
    if (this.syncInterval) clearInterval(this.syncInterval);
  }
}


// --- 3. ИНИЦИАЛИЗАЦИЯ И СВЯЗЬ ---

let taskCounter = null;
function initTaskCounter() {
  if (!window.location.href.includes('npro.maps.yandex.ru')) return;
  if (!taskCounter) {
    taskCounter = new TaskCounterLeftOfSettings();
    window.taskCounter = taskCounter;
  }
}

// Инжект безопасного скрипта перехвата токенов
function injectTokenFinderScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('token-finder-inpage.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

// Слушатель сообщений от inpage скрипта
let lastKnownToken = null;
window.addEventListener('message', (event) => {
  if (event.source !== window || event.data?.direction !== 'from-token-finder') return;
  const { type, token } = event.data;
  if (!type || !token) return;

  if (token === lastKnownToken) return;
  lastKnownToken = token;

  chrome.storage.local.set({ universalToken: token, tokenFoundAt: Date.now() });
  chrome.runtime.sendMessage({ action: 'foundToken', token, type }).catch(() => {});
});

// Единый маршрутизатор сообщений от popup/background
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.action) {
      case 'setPluginEnabled':
        if (taskCounter) msg.enabled ? taskCounter.enable() : taskCounter.disable();
        sendResponse({ success: true });
        break;

      case 'scrapeStats':
        sendResponse({ success: true, data: scrapeStatsFromScreen() });
        break;

      case 'setContinuousState':
        const found = findContinuousCheckbox();
        if (!found) {
          sendResponse({ success: false, error: 'not_found' });
        } else {
          if (found.cb.checked !== msg.checked) {
            simulateRealClick(found.clickableEl);
          }
          setTimeout(() => sendResponse({ success: true, checked: found.cb.checked }), 100);
        }
        return true; // Асинхронный ответ

      case 'toggleCounter':
        if (taskCounter) {
          const newVisible = taskCounter.toggleVisibility(msg.visible);
          sendResponse({ success: true, visible: newVisible });
        } else {
          sendResponse({ success: false, error: 'not_initialized' });
        }
        break;
        
      default:
        sendResponse({ success: false, error: 'unknown_action' });
    }
    return true;
  });
}

// Оптимизированный запуск скриптов при старте
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initTaskCounter, 2000);
    setTimeout(injectTokenFinderScript, 500);
  });
} else {
  setTimeout(initTaskCounter, 2000);
  setTimeout(injectTokenFinderScript, 500);
}
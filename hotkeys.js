// hotkeys.js

class HotkeyManager {
  constructor() {
    this.keys = new Set();
    this.lastAltEPressTime = 0;
    this.altECount = 0;
    this.init();
    console.log('[Hotkeys] Manager initialized for new interface');
  }

  init() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && !e.altKey) return;
      this.handleKeyDown(e);
    }, true);

    document.addEventListener('keyup', (e) => {
      this.handleKeyUp(e);
    }, true);
  }

  handleKeyDown(e) {
    if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
      this.keys.add('alt');
    }
    if (e.key === 'x' || e.key === 'X' || e.code === 'KeyX') {
      this.keys.add('x');
    }
    if (e.key === 'v' || e.key === 'V' || e.code === 'KeyV') {
      this.keys.add('v');
    }
    if (e.key === 'b' || e.key === 'B' || e.code === 'KeyB') {
      this.keys.add('b');
    }
    if (e.key === 'n' || e.key === 'N' || e.code === 'KeyN') {
      this.keys.add('n');
    }
    if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
      this.keys.add('e');
    }
    if (e.key === 'd' || e.key === 'D' || e.code === 'KeyD') {
      this.keys.add('d');
    }

    this.checkCombinations(e);
  }

  handleKeyUp(e) {
    if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
      this.keys.delete('alt');
    }
    if (e.key === 'x' || e.key === 'X' || e.code === 'KeyX') {
      this.keys.delete('x');
    }
    if (e.key === 'v' || e.key === 'V' || e.code === 'KeyV') {
      this.keys.delete('v');
    }
    if (e.key === 'b' || e.key === 'B' || e.code === 'KeyB') {
      this.keys.delete('b');
    }
    if (e.key === 'n' || e.key === 'N' || e.code === 'KeyN') {
      this.keys.delete('n');
    }
    if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
      this.keys.delete('e');
    }
    if (e.key === 'd' || e.key === 'D' || e.code === 'KeyD') {
      this.keys.delete('d');
    }
  }

  checkCombinations(e) {
    // ALT + E - Принять правку (для модерации) или "Верно" + "Оценить" (для проверки)
    if (e.altKey && (e.key === 'e' || e.key === 'E' || e.code === 'KeyE')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Сначала проверяем, есть ли кнопка "Принять" (модерация)
      const acceptButton = document.querySelector('.nk-moderation-task-view__actions-button_action_accept');
      if (acceptButton && !acceptButton.disabled) {
        console.log('[Hotkeys] Alt+E: Нажимаем кнопку "Принять"');
        this.simulateRealClick(acceptButton);
        return;
      }
      
      // Если кнопки "Принять" нет, работаем со старой логикой (Верно + Оценить)
      const now = Date.now();
      const timeSinceLastPress = now - this.lastAltEPressTime;
      
      // Если прошло больше 2 секунд - сбрасываем счетчик (новое действие)
      if (timeSinceLastPress > 2000) {
        this.altECount = 0;
      }
      
      this.lastAltEPressTime = now;
      this.altECount++;
      
      console.log(`[Hotkeys] Alt+E нажата (раз: ${this.altECount})`);
      
      if (this.altECount === 1) {
        // Первое нажатие - выбираем "Верно"
        console.log('[Hotkeys] Первое нажатие Alt+E: выбираем "Верно"');
        this.selectCorrectOption();
        return;
      } else if (this.altECount === 2) {
        // Второе нажатие - нажимаем "Оценить"
        console.log('[Hotkeys] Второе нажатие Alt+E: нажимаем "Оценить"');
        this.clickRateButton();
        this.altECount = 0; // Сбрасываем после успешного нажатия
        return;
      }
    }

    // ALT + X - Непрерывный режим
    if (e.altKey && (e.key === 'x' || e.key === 'X' || e.code === 'KeyX')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.toggleContinuousMode();
      return;
    }

    // ALT + V - MRC камера
    if (e.altKey && (e.key === 'v' || e.key === 'V' || e.code === 'KeyV')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.toggleMrcCameraButton();
      return;
    }

    // ALT + B - Панорама
    if (e.altKey && (e.key === 'b' || e.key === 'B' || e.code === 'KeyB')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.togglePanoramaButton();
      return;
    }

    // ALT + D - Откатить правку (для модерации) или Забраковать (для проверки)
    if (e.altKey && (e.key === 'd' || e.key === 'D' || e.code === 'KeyD')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Сначала проверяем, есть ли кнопка "Откатить" (модерация)
      const revertButton = document.querySelector('.nk-moderation-task-view__actions-button_action_revert');
      if (revertButton && !revertButton.disabled) {
        console.log('[Hotkeys] Alt+D: Нажимаем кнопку "Откатить"');
        this.simulateRealClick(revertButton);
        return;
      }
      
      // Если кнопки "Откатить" нет, работаем со старой логикой (Забраковать)
      this.rejectTask();
      return;
    }

    // ALT + N - Статистика
    if (e.altKey && (e.key === 'n' || e.key === 'N' || e.code === 'KeyN')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.fetchStats();
      return;
    }
  }

  // Выбирает опцию "Верно" в форме оценки
  selectCorrectOption() {
    console.log('[Hotkeys] Выбираем "Верно"...');
    
    // Ищем все кнопки с текстом "Верно"
    const allButtons = Array.from(document.querySelectorAll('button'));
    const correctButton = allButtons.find(btn => {
      const text = btn.textContent.trim().toLowerCase();
      return text.includes('верно') && text.includes('👍');
    });
    
    if (correctButton && !correctButton.disabled) {
      console.log('[Hotkeys] ✅ Кнопка "Верно 👍" найдена');
      this.simulateRealClick(correctButton);
      return true;
    }
    
    // Альтернативный поиск через radio buttons
    const radioButtons = document.querySelectorAll('.nk-radio');
    for (const radio of radioButtons) {
      const text = radio.textContent.trim().toLowerCase();
      if (text.includes('верно') && text.includes('👍')) {
        const button = radio.querySelector('button');
        if (button && !button.disabled) {
          console.log('[Hotkeys] ✅ Radio "Верно 👍" найдена');
          this.simulateRealClick(button);
          return true;
        }
      }
    }
    
    console.log('[Hotkeys] ❌ Кнопка "Верно" не найдена');
    return false;
  }

  // ALT+E - Кнопка "Оценить"
  clickRateButton() {
    console.log('[Hotkeys] Нажатие кнопки "Оценить"...');
    
    // Прямой селектор
    const rateButton = document.querySelector('.nk-form-submit-view__submit');
    
    if (rateButton) {
      console.log('[Hotkeys] ✅ Кнопка "Оценить" найдена:', rateButton.className);
      
      // Проверяем, не заблокирована ли кнопка
      if (rateButton.disabled || rateButton.classList.contains('nk-button_disabled')) {
        console.log('[Hotkeys] ⚠️ Кнопка заблокирована, проверяем форму...');
        
        // Проверяем, выбрана ли оценка
        const selectedRadio = document.querySelector('.nk-radio_checked');
        if (!selectedRadio) {
          console.log('[Hotkeys] ❌ Оценка не выбрана! Сначала выберите "Верно" (первый Alt+E)');
          return;
        }
        
        // Если оценка выбрана, но кнопка всё ещё заблокирована - пробуем всё равно нажать
        console.log('[Hotkeys] Оценка выбрана, но кнопка заблокирована - пробуем активировать');
        this.activateAndClickRateButton(rateButton);
        return;
      }
      
      // Если кнопка активна - нажимаем
      console.log('[Hotkeys] 🎯 Нажимаем кнопку "Оценить"');
      this.simulateRealClick(rateButton);
    } else {
      // Резервный поиск
      const allButtons = Array.from(document.querySelectorAll('button'));
      const rateBtn = allButtons.find(btn => 
        btn.textContent.trim() === 'Оценить' || 
        btn.querySelector('.nk-button__text')?.textContent.trim() === 'Оценить' ||
        btn.textContent.trim() === 'Готово' || 
        btn.querySelector('.nk-button__text')?.textContent.trim() === 'Готово'
      );
      
      if (rateBtn) {
        console.log('[Hotkeys] ✅ Кнопка найдена через текст');
        if (!rateBtn.disabled) {
          this.simulateRealClick(rateBtn);
        } else {
          console.log('[Hotkeys] ⚠️ Кнопка заблокирована, пробуем активировать');
          this.activateAndClickRateButton(rateBtn);
        }
      } else {
        console.log('[Hotkeys] ❌ Кнопка "Оценить" не найдена');
      }
    }
  }

  // Активирует заблокированную кнопку и нажимает её
  activateAndClickRateButton(button) {
    try {
      // Сохраняем оригинальное состояние
      const originalDisabled = button.disabled;
      const originalReadOnly = button.readOnly;
      
      // Временно активируем кнопку
      button.disabled = false;
      button.readOnly = false;
      button.removeAttribute('disabled');
      button.removeAttribute('readonly');
      button.classList.remove('nk-button_disabled', 'disabled', 'is-disabled');
      
      console.log('[Hotkeys] Временно активировали кнопку');
      
      // Ждем немного и нажимаем
      setTimeout(() => {
        try {
          this.simulateRealClick(button);
          
          // Восстанавливаем состояние через некоторое время
          setTimeout(() => {
            if (originalDisabled) button.disabled = true;
            if (originalReadOnly) button.readOnly = true;
            if (originalDisabled) button.setAttribute('disabled', '');
          }, 100);
          
        } catch (error) {
          console.error('[Hotkeys] Ошибка при нажатии:', error);
        }
      }, 50);
      
    } catch (error) {
      console.error('[Hotkeys] Ошибка активации кнопки:', error);
    }
  }

  // Проверяет, выбрано ли "Верно"
  checkIfCorrectSelected() {
    // Проверяем разные способы определения выбора "Верно"
    const checks = [
      // 1. По выбранной радиокнопке с классом
      () => {
        const selectedRadio = document.querySelector('.nk-radio_checked');
        if (!selectedRadio) return false;
        
        // Проверяем текст родительского контейнера
        const container = selectedRadio.closest('.nk-form-field');
        if (container && container.textContent.toLowerCase().includes('верно')) {
          return true;
        }
        
        // Проверяем соседние элементы
        const siblings = Array.from(selectedRadio.parentElement.children);
        for (const sibling of siblings) {
          if (sibling.textContent && sibling.textContent.toLowerCase().includes('верно')) {
            return true;
          }
        }
        return false;
      },
      
      // 2. По input[type="radio"]:checked
      () => {
        const checkedInput = document.querySelector('input[type="radio"]:checked');
        if (!checkedInput) return false;
        
        // Ищем label с текстом "Верно"
        const label = document.querySelector(`label[for="${checkedInput.id}"]`);
        if (label && label.textContent.toLowerCase().includes('верно')) {
          return true;
        }
        
        // Ищем родительский label
        const parentLabel = checkedInput.closest('label');
        if (parentLabel && parentLabel.textContent.toLowerCase().includes('верно')) {
          return true;
        }
        
        return false;
      },
      
      // 3. По любому элементу с классом checked и текстом "Верно"
      () => {
        const checkedElements = document.querySelectorAll('.checked, .is-checked, [aria-checked="true"]');
        for (const el of checkedElements) {
          if (el.textContent && el.textContent.toLowerCase().includes('верно')) {
            return true;
          }
        }
        return false;
      }
    ];
    
    for (const check of checks) {
      if (check()) {
        console.log('[Hotkeys] ✅ "Верно" выбрано');
        return true;
      }
    }
    
    console.log('[Hotkeys] ❌ "Верно" не выбрано');
    return false;
  }

// 2. ALT+X - Непрерывный режим
  toggleContinuousMode() {
    console.log('[Hotkeys] Alt+X: Переключение непрерывного режима...');
    const labels = Array.from(document.querySelectorAll('.nk-checkbox, label'));
    const continuousLabel = labels.find(l => l.textContent.toLowerCase().includes('непрерывн'));
    
    if (continuousLabel) {
      const clickable = continuousLabel.closest('.nk-checkbox') || continuousLabel;
      this.simulateRealClick(clickable);
      console.log('[Hotkeys] ✅ Непрерывный режим переключен');
    } else {
      console.log('[Hotkeys] ❌ Чекбокс непрерывного режима не найден');
    }
  }

  // 3. ALT+V - MRC камера
  toggleMrcCameraButton() {
    console.log('[Hotkeys] Alt+V: Кнопка MRC камеры...');
    
    let mrcButton = document.querySelector('.nk-mrc-layer-control-view button');
    
    if (!mrcButton) {
      const mrcIcons = document.querySelectorAll('.nk-icon_id_mrc');
      for (const icon of mrcIcons) {
        mrcButton = icon.closest('button');
        if (mrcButton) break;
      }
    }
    
    if (mrcButton) {
      console.log('[Hotkeys] ✅ Кнопка MRC найдена');
      if (!mrcButton.disabled) {
        this.simulateRealClick(mrcButton);
      } else {
        console.log('[Hotkeys] ⚠️ Кнопка MRC заблокирована');
      }
    } else {
      console.log('[Hotkeys] ❌ Кнопка MRC не найдена');
    }
  }

  // 4. ALT+B - Панорама
  togglePanoramaButton() {
    console.log('[Hotkeys] Alt+B: Кнопка Панорамы...');
    
    let panoramaButton = document.querySelector('button.nk-panorama-layer-control-view');
    
    if (!panoramaButton) {
      const panoramaIcons = document.querySelectorAll('.nk-icon_id_panorama');
      for (const icon of panoramaIcons) {
        panoramaButton = icon.closest('button');
        if (panoramaButton) break;
      }
    }
    
    if (panoramaButton) {
      console.log('[Hotkeys] ✅ Кнопка Панорамы найдена');
      if (!panoramaButton.disabled) {
        this.simulateRealClick(panoramaButton);
      } else {
        console.log('[Hotkeys] ⚠️ Кнопка Панорамы заблокирована');
      }
    } else {
      console.log('[Hotkeys] ❌ Кнопка Панорамы не найдена');
    }
  }

  // 5. ALT+D - Забраковать
  rejectTask() {
      console.log('[Hotkeys] Alt+D: Поиск кнопки отклонения...');
      
      // БЫСТРЫЙ ПУТЬ: Ищем по известным классам модерации Яндекса (если они есть)
      const exactButton = document.querySelector('.nk-moderation-task-view__actions-button_action_reject');
      if (exactButton && !exactButton.disabled) {
        this.simulateRealClick(exactButton);
        return;
      }

      // МЕДЛЕННЫЙ ПУТЬ: Оставляем ваш старый код с поиском по тексту как fallback
      const allButtons = document.querySelectorAll('button');
      const rejectTexts = ['неверно', 'отклонить', 'забраковать', 'отказать'];
    
    let rejectButton = null;
    
    for (const button of allButtons) {
      const buttonText = button.textContent.trim().toLowerCase();
      
      if (rejectTexts.some(text => buttonText.includes(text))) {
        rejectButton = button;
        console.log('[Hotkeys] ✅ Найдена кнопка отклонения:', button.textContent.trim());
        break;
      }
      
      const innerText = button.querySelector('.nk-button__text')?.textContent.trim().toLowerCase();
      if (innerText && rejectTexts.some(text => innerText.includes(text))) {
        rejectButton = button;
        console.log('[Hotkeys] ✅ Найдена кнопка отклонения (внутренний текст):', innerText);
        break;
      }
    }
    
    if (rejectButton) {
      if (!rejectButton.disabled) {
        console.log('[Hotkeys] 🎯 Нажимаем кнопку отклонения');
        this.simulateRealClick(rejectButton);
      } else {
        console.log('[Hotkeys] ⚠️ Кнопка отклонения заблокирована');
      }
    } else {
      console.log('[Hotkeys] ❌ Кнопка отклонения не найдена');
    }
  }

  // 6. ALT+N - Пересчет статистики цен
  fetchStats() {
    console.log('[Hotkeys] Alt+N: Пересчет статистики цен...');
    if (typeof enhanceStatsWithPrices === 'function') {
      enhanceStatsWithPrices();
      console.log('[Hotkeys] ✅ enhanceStatsWithPrices вызван');
    }
  }

  // Вспомогательная функция для клика
  simulateRealClick(element) {
    try {
      const mouseEvents = ['mousedown', 'mouseup', 'click'];
      
      mouseEvents.forEach(eventType => {
        const event = new MouseEvent(eventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
        });
        element.dispatchEvent(event);
      });
      
      element.click();
      
      return true;
    } catch (error) {
      console.error('[Hotkeys] Ошибка при клике:', error);
      return false;
    }
  }
}

// Инициализация с защитой от повторной инициализации
if (!window.hotkeyManagerInitialized) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        new HotkeyManager();
        window.hotkeyManagerInitialized = true;
      }, 1000);
    });
  } else {
    setTimeout(() => {
      new HotkeyManager();
      window.hotkeyManagerInitialized = true;
    }, 1000);
  }
}

window.HotkeyManager = HotkeyManager;
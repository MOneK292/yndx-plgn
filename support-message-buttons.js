// support-message-buttons.js
class SupportMessageButtons {
  constructor() {
    this.textarea = null;
    this.buttonsContainer = null;
    this.currentTextareaId = null;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.injectButtons(), 2000);
      });
    } else {
      setTimeout(() => this.injectButtons(), 2000);
    }

    let supportButtonsTimeout;
    let supportButtonsLastRun = 0;
    const SUPPORT_BUTTONS_THROTTLE = 2000;
    let observerDisconnected = false;

    const observer = new MutationObserver(() => {
      const now = Date.now();
      const timeSinceLastRun = now - supportButtonsLastRun;
      
      if (timeSinceLastRun < SUPPORT_BUTTONS_THROTTLE) {
        return;
      }
      
      clearTimeout(supportButtonsTimeout);
      supportButtonsTimeout = setTimeout(() => {
        supportButtonsLastRun = Date.now();
        this.checkAndInjectButtons();
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    // Отключаем observer через 30 секунд
    setTimeout(() => {
      observer.disconnect();
      observerDisconnected = true;
      console.log('[SupportButtons] MutationObserver отключен для экономии ресурсов');
    }, 30000);

    // Периодическая проверка каждые 3 секунды (легкая)
    setInterval(() => {
      if (observerDisconnected) {
        this.checkAndInjectButtons();
      }
    }, 3000);

    console.log('[SupportButtons] Observer initialized');
  }

  checkAndInjectButtons() {
    const textarea = this.findTextarea();
    if (!textarea) {
      return;
    }

    const textareaId = textarea.id;
    if (textareaId !== this.currentTextareaId) {
      console.log('[SupportButtons] New textarea detected:', textareaId);
      
      const oldButtons = document.querySelector('.support-quick-buttons');
      if (oldButtons) {
        oldButtons.remove();
      }

      this.buttonsContainer = null;
      this.currentTextareaId = textareaId;
      this.textarea = textarea;
      setTimeout(() => this.injectButtons(), 100);
    }
  }

  findTextarea() {
    const textareas = document.querySelectorAll('textarea.nk-text-area__control');
    for (const textarea of textareas) {
      const label = document.querySelector(`label[for="${textarea.id}"]`);
      if (label && label.textContent.includes('Сообщение для Поддержки')) {
        return textarea;
      }
    }
    return null;
  }

  findLabelElement() {
    const labels = Array.from(document.querySelectorAll('label.nk-form-control__label'));
    return labels.find(l => l.textContent.includes('Сообщение для Поддержки'));
  }

  injectButtons() {
    this.textarea = this.findTextarea();
    if (!this.textarea) {
      console.log('[SupportButtons] Textarea not found');
      return;
    }

    const label = this.findLabelElement();
    if (!label) {
      console.log('[SupportButtons] Label not found');
      return;
    }

    const existingButtons = document.querySelector('.support-quick-buttons');
    if (existingButtons) {
      if (label.parentElement.contains(existingButtons)) {
        console.log('[SupportButtons] Buttons already exist for current textarea');
        return;
      } else {
        existingButtons.remove();
      }
    }

    this.currentTextareaId = this.textarea.id;

    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.className = 'support-quick-buttons';
    this.buttonsContainer.style.cssText = `display: inline-flex; gap: 8px; margin-left: 12px; vertical-align: middle;`;

    const button1 = this.createButton('🔖', 'Закладка', () => {
      this.insertText('Данную правку невозможно исправить с помощью Народной карты, передайте, пожалуйста, в другую очередь');
    });

    const button2 = this.createButton('🏠', 'ФОС', () => {
      this.insertText('Похоже, пользователь перепутал форму обратной связи (ФОС) и закладки. Сообщите, пожалуйста, ему об этом');
    });

    this.buttonsContainer.appendChild(button1);
    this.buttonsContainer.appendChild(button2);
    label.parentElement.appendChild(this.buttonsContainer);

    console.log('[SupportButtons] Buttons injected successfully for', this.currentTextareaId);
  }

  createButton(emoji, title, onClick) {
    const button = document.createElement('button');
    button.className = 'nk-button nk-button_theme_islands nk-button_size_s';
    button.type = 'button';
    button.title = title;
    button.style.cssText = `padding: 4px 8px; font-size: 14px; min-width: auto; height: 24px; line-height: 1; border-radius: 4px; background: #4d4d4d; border: 1px solid #d0d0d0; cursor: pointer; transition: all 0.2s;`;
    button.innerHTML = `<span class="nk-button__text">${emoji}</span>`;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#4d4d4d';
      button.style.borderColor = '#4d4d4d';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#4d4d4d';
      button.style.borderColor = '#4d4d4d';
    });

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });

    return button;
  }

  insertText(text) {
    this.textarea = this.findTextarea();
    if (!this.textarea) {
      console.error('[SupportButtons] Textarea not found');
      return;
    }

    this.textarea.value = text;
    this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    this.textarea.dispatchEvent(new Event('change', { bubbles: true }));
    this.textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    this.textarea.focus();
    console.log('[SupportButtons] Text inserted into', this.textarea.id);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SupportMessageButtons();
    console.log('[SupportButtons] Manager initialized');
  });
} else {
  new SupportMessageButtons();
  console.log('[SupportButtons] Manager initialized');
}

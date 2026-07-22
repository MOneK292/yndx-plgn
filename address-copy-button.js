// Скрипт для добавления кнопки копирования ко всем геообъектам
function addCopyButtonToAddress() {
  const addressElements = document.querySelectorAll('.nk-geoobject-preview-opener-view');
  
  addressElements.forEach((addressElement) => {
    const addressText = addressElement.textContent.trim();
    if (!addressText) return;
    
    // Ищем родительский контейнер более гибко
    const parent = addressElement.closest('.nk-event-view__title') || 
                   addressElement.parentElement;
    
    if (!parent) return;
    
    // Проверяем есть ли уже кнопка
    if (parent.querySelector('.address-copy-btn')) {
      return;
    }
    
    const copyButton = document.createElement('button');
    copyButton.className = 'address-copy-btn';
    copyButton.type = 'button';
    copyButton.style.cssText = `display: inline-block; padding: 0 4px; font-size: 11px; cursor: pointer; background: transparent; border: 1px solid #b0b0b0; border-radius: 2px; color: #666; transition: background 0.2s, border-color 0.2s; font-family: inherit; line-height: 14px; height: 14px; vertical-align: middle; margin-left: 4px; box-sizing: border-box;`;
    copyButton.innerHTML = '📋';
    copyButton.title = 'Копировать';
    
    copyButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        await navigator.clipboard.writeText(addressText);
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '✓';
        copyButton.style.background = '#8FCB69';
        copyButton.style.color = '#fff';
        copyButton.style.borderColor = '#8FCB69';
        copyButton.title = 'Скопировано!';
        
        setTimeout(() => {
          copyButton.innerHTML = originalText;
          copyButton.style.background = 'transparent';
          copyButton.style.color = '#666';
          copyButton.style.borderColor = '#b0b0b0';
          copyButton.title = 'Копировать';
        }, 2000);
      } catch (err) {
        copyButton.innerHTML = '✗';
        copyButton.style.background = '#ff5252';
        copyButton.style.color = '#fff';
        copyButton.title = 'Ошибка';
        
        setTimeout(() => {
          copyButton.innerHTML = '📋';
          copyButton.style.background = 'transparent';
          copyButton.style.color = '#666';
          copyButton.title = 'Копировать';
        }, 2000);
      }
    });
    
    copyButton.addEventListener('mouseenter', () => {
      if (!copyButton.innerHTML.includes('✓')) {
        copyButton.style.background = 'rgba(0, 0, 0, 0.05)';
        copyButton.style.borderColor = '#999';
      }
    });
    
    copyButton.addEventListener('mouseleave', () => {
      if (!copyButton.innerHTML.includes('✓')) {
        copyButton.style.background = 'transparent';
        copyButton.style.borderColor = '#b0b0b0';
      }
    });
    
    parent.appendChild(copyButton);
  });
}

// Вспомогательная функция дебаунса
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const debouncedAddCopyButton = debounce(addCopyButtonToAddress, 300);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(addCopyButtonToAddress, 500);
  });
} else {
  setTimeout(addCopyButtonToAddress, 500);
}

// Оптимизированный MutationObserver
const addressCopyObserver = new MutationObserver((mutations) => {
  let hasAddedNodes = false;
  for (let i = 0; i < mutations.length; i++) {
    if (mutations[i].addedNodes.length > 0) {
      hasAddedNodes = true;
      break;
    }
  }
  
  if (hasAddedNodes) {
    debouncedAddCopyButton();
  }
});

// Наблюдаем за DOM
setTimeout(() => {
  const appContainer = document.querySelector('.nk-app') || document.getElementById('app') || document.body;
  if (appContainer) {
    addressCopyObserver.observe(appContainer, {
      childList: true,
      subtree: true
    });
  }
  addCopyButtonToAddress();
}, 1000);
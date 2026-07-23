// Скрипт для добавления кнопки копирования ко всем геообъектам
function addCopyButtonToAddress() {
  const addressElements = document.querySelectorAll('.nk-geoobject-preview-opener-view');
  
  // Список не копируемых общих типов и маневров
  const ignoredTypes = [
    'запрещённый манёвр',
    'разрешённый манёвр',
    'манёвр',
    'светофор',
    'пешеходный светофор',
    'искусственная неровность',
    'железнодорожный переезд',
    'камера'
  ];

  addressElements.forEach((addressElement) => {
    // Получаем только непосредственный текст элемента (без вложенных тегов)
    let directText = '';
    for (let node of addressElement.childNodes) {
      if (node.nodeType === 3) {
        directText += node.textContent;
      }
    }
    directText = directText.trim().toLowerCase();
    
    if (!directText) return;
    
    // Игнорируем общие типы и маневры без названия
    if (ignoredTypes.some(type => directText.includes(type))) {
      return;
    }
    
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

// Скрипт для добавления кнопки копирования к номеру дома (улица + номер дома)
function addCopyButtonToHouseNumber() {
  const houseLabels = Array.from(document.querySelectorAll('.nk-form-control__label')).filter(
    el => el.textContent.trim() === 'Номер дома'
  );

  houseLabels.forEach((labelEl) => {
    const gridRow = labelEl.closest('.nk-grid');
    if (!gridRow) return;

    const houseNumEl = gridRow.querySelector('.nk-text-control__text span[dir="auto"]') || 
                       gridRow.querySelector('.nk-text-control__text');
    if (!houseNumEl) return;

    const houseNumText = houseNumEl.textContent.trim();
    if (!houseNumText) return;

        const parentToAppend = houseNumEl.closest('.nk-text-control__text') || houseNumEl.parentElement;
    if (!parentToAppend) return;

    if (parentToAppend.querySelector('.house-copy-btn')) {
      return;
    }

    const copyButton = document.createElement('button');
    copyButton.className = 'house-copy-btn';
    copyButton.type = 'button';
    copyButton.style.cssText = `display: inline-block; padding: 0 4px; font-size: 11px; cursor: pointer; background: transparent; border: 1px solid #b0b0b0; border-radius: 2px; color: #666; transition: background 0.2s, border-color 0.2s; font-family: inherit; line-height: 14px; height: 14px; vertical-align: middle; margin-left: 6px; box-sizing: border-box;`;
    copyButton.innerHTML = '📋';
    copyButton.title = 'Копировать адрес с номером дома';

    copyButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Ищем улицу на странице
      let streetNameText = '';
      const streetLabels = Array.from(document.querySelectorAll('.nk-sidebar-control__label')).filter(
        el => el.textContent.trim() === 'Улица'
      );

      if (streetLabels.length > 0) {
        const streetGrid = streetLabels[0].closest('.nk-grid');
        if (streetGrid) {
          const streetOpener = streetGrid.querySelector('.nk-geoobject-preview-opener-view');
          if (streetOpener) {
            for (let node of streetOpener.childNodes) {
              if (node.nodeType === 3) {
                streetNameText += node.textContent;
              }
            }
            streetNameText = streetNameText.trim();
          }
        }
      }

      const fullAddress = streetNameText ? `${streetNameText}, ${houseNumText}` : houseNumText;

      try {
        await navigator.clipboard.writeText(fullAddress);
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
          copyButton.title = 'Копировать адрес с номером дома';
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
          copyButton.title = 'Копировать адрес с номером дома';
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

    parentToAppend.appendChild(copyButton);
  });
}

function runAllCopyButtons() {
  addCopyButtonToAddress();
  addCopyButtonToHouseNumber();
}

// Вспомогательная функция дебаунса
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const debouncedAddCopyButton = debounce(runAllCopyButtons, 300);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(runAllCopyButtons, 500);
  });
} else {
  setTimeout(runAllCopyButtons, 500);
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
  runAllCopyButtons();
}, 1000);
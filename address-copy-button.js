// Скрипт для добавления кнопки копирования адреса
function addCopyButtonToAddress() {
  console.log('[AddressCopy] 🔄 Запуск функции добавления кнопок...');
  const addressElements = document.querySelectorAll('.nk-geoobject-preview-opener-view');
  console.log(`[AddressCopy] 📍 Найдено элементов с адресами: ${addressElements.length}`);
  
  addressElements.forEach((addressElement, index) => {
    const addressText = addressElement.textContent.trim();
    console.log(`[AddressCopy] Обработка элемента ${index + 1}: "${addressText}"`);
    
    // Ищем родительский контейнер более гибко
    const parent = addressElement.closest('.nk-event-view__title') || 
                   addressElement.parentElement;
    
    if (!parent) {
      console.log(`[AddressCopy] ❌ Родитель не найден для: "${addressText}"`);
      return;
    }
    
    // Проверяем есть ли уже кнопка
    if (parent.querySelector('.address-copy-btn')) {
      console.log(`[AddressCopy] ⏭️ Кнопка уже существует для: "${addressText}"`);
      return;
    }
    
    // Проверяем, что это именно адрес (есть иконка group-addr)
    // Ищем в более широком контексте
    const container = addressElement.closest('.nk-event-view') || 
                     addressElement.closest('.nk-section') ||
                     addressElement.closest('.nk-list-item-view') ||
                     parent.parentElement;
    
    if (container) {
      const addressIcon = container.querySelector('.nk-geoobject-icon_id_group-addr');
      if (!addressIcon) {
        console.log(`[AddressCopy] ⏭️ Это не адрес (нет иконки group-addr), пропускаем: "${addressText}"`);
        return;
      }
    }
    
    console.log(`[AddressCopy] ✅ Добавляем кнопку для: "${addressText}"`);
    
    const copyButton = document.createElement('button');
    copyButton.className = 'address-copy-btn';
    copyButton.type = 'button';
    copyButton.style.cssText = `display: inline-block; padding: 0 4px; font-size: 11px; cursor: pointer; background: transparent; border: 1px solid #b0b0b0; border-radius: 2px; color: #666; transition: background 0.2s, border-color 0.2s; font-family: inherit; line-height: 14px; height: 14px; vertical-align: middle; margin-left: 4px; box-sizing: border-box;`;
    copyButton.innerHTML = '📋';
    copyButton.title = 'Копировать адрес';
    
    copyButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`[AddressCopy] Копирование: "${addressText}"`);
      
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
          copyButton.title = 'Копировать адрес';
        }, 2000);
      } catch (err) {
        console.error('[AddressCopy] Ошибка копирования:', err);
        copyButton.innerHTML = '✗';
        copyButton.style.background = '#ff5252';
        copyButton.style.color = '#fff';
        copyButton.title = 'Ошибка копирования';
        
        setTimeout(() => {
          copyButton.innerHTML = '📋';
          copyButton.style.background = '#f5f5f5';
          copyButton.style.color = '#666';
          copyButton.title = 'Копировать адрес';
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
    console.log(`[AddressCopy] 🎉 Кнопка успешно добавлена для: "${addressText}"`);
  });
  
  console.log('[AddressCopy] ✔️ Завершение функции добавления кнопок');
}

console.log('[AddressCopy] Инициализация скрипта...');

// Слушаем клики по элементам задания
document.addEventListener('click', (e) => {
  const target = e.target;
  
  // Проверяем клик по секции задания или её содержимому
  const taskSection = target.closest('.nk-moderation-task-view') || 
                      target.closest('.nk-event-view') ||
                      target.closest('.nk-section_level_2');
  
  if (taskSection) {
    console.log('[AddressCopy] 🖱️ Клик по заданию, добавляем кнопки');
    
    // Запускаем сразу и через небольшую задержку
    setTimeout(() => addCopyButtonToAddress(), 50);
    setTimeout(() => addCopyButtonToAddress(), 200);
  }
  
  // Также проверяем клик по кнопкам навигации
  if (target.closest('.nk-button') || 
      target.closest('[class*="task"]') ||
      target.closest('[class*="next"]') ||
      target.closest('[class*="accept"]')) {
    
    const buttonText = target.textContent?.trim() || '';
    console.log('[AddressCopy] 🖱️ Клик по кнопке:', buttonText);
    
    setTimeout(() => addCopyButtonToAddress(), 250);
  }
}, true);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(addCopyButtonToAddress, 750);
  });
} else {
  setTimeout(addCopyButtonToAddress, 750);
}

let addressCopyObserverTimeout;
let addressCopyLastRun = 0;
const ADDRESS_COPY_MIN_INTERVAL = 1000; // Минимум 1 секунда между срабатываниями
const ADDRESS_COPY_DEBOUNCE = 500; // Debounce 500мс

const addressCopyObserver = new MutationObserver((mutations) => {
  // Жесткое ограничение - не чаще 1 раза в 1 секунду
  const now = Date.now();
  const timeSinceLastRun = now - addressCopyLastRun;
  
  if (timeSinceLastRun < ADDRESS_COPY_MIN_INTERVAL) {
    return; // Пропускаем если слишком рано
  }
  
  // Проверяем появление элементов с адресами напрямую
  const hasAddressElement = mutations.some(mutation => {
    if (mutation.type !== 'childList') return false;
    
    return Array.from(mutation.addedNodes).some(node => {
      if (node.nodeType !== 1) return false;
      
      // Проверяем появление самого элемента с адресом или его родителя
      const hasAddress = node.classList?.contains('nk-geoobject-preview-opener-view') ||
                        (node.querySelector && node.querySelector('.nk-geoobject-preview-opener-view'));
      
      if (hasAddress) {
        console.log('[AddressCopy] 🔍 Обнаружен элемент с адресом:', node.className || node.tagName);
        return true;
      }
      
      return false;
    });
  });
  
  if (!hasAddressElement) {
    return;
  }
  
  // Debounce - запускаем через 500мс после последнего изменения
  clearTimeout(addressCopyObserverTimeout);
  addressCopyObserverTimeout = setTimeout(() => {
    addressCopyLastRun = Date.now();
    console.log('[AddressCopy] 🎯 Добавляем кнопки');
    addCopyButtonToAddress();
    
    // Дополнительная проверка через 1 секунду
    setTimeout(() => addCopyButtonToAddress(), 1000);
  }, ADDRESS_COPY_DEBOUNCE);
});

// Периодическая проверка наличия адресов без кнопок (каждые 2.5 секунды)
setInterval(() => {
  const addressElements = document.querySelectorAll('.nk-geoobject-preview-opener-view');
  if (addressElements.length > 0) {
    const addressesWithoutButtons = Array.from(addressElements).filter(el => {
      const parent = el.closest('.nk-event-view__title');
      return parent && !parent.querySelector('.address-copy-btn');
    });
    
    if (addressesWithoutButtons.length > 0) {
      console.log(`[AddressCopy] 🔄 Найдено ${addressesWithoutButtons.length} адресов без кнопок, добавляем...`);
      addCopyButtonToAddress();
    }
  }
}, 2500);

setTimeout(() => {
  // Наблюдаем за основным контейнером приложения где появляются задания
  const appContainer = document.querySelector('.nk-app') || 
                      document.querySelector('#app') ||
                      document.body;
  
  if (appContainer) {
    console.log('[AddressCopy] Запуск MutationObserver для отслеживания новых заданий');
    addressCopyObserver.observe(appContainer, {
      childList: true,
      subtree: true, // Включаем subtree чтобы ловить sidebar
      attributes: false,
      characterData: false
    });
  }
  
  // Первоначальный запуск
  setTimeout(addCopyButtonToAddress, 500);
}, 1000);

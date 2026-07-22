// stats-enhancer.js - Итоговая сумма в первой строке

function enhanceStatsWithPrices() {
  // 1. Проверяем, открыт ли "Диспетчер задач"
  const selectedTab = document.querySelector('.nk-tabs-bar__tab_selected');
  if (!selectedTab || !selectedTab.textContent.includes('Диспетчер задач')) {
    return;
  }

  const coefficients = {
    'сообщения о неточностях': { 'сделано базовых': 6, 'выполнено проверок': 6.5 },
    'модерация': { 'сделано базовых': 1.5, 'выполнено проверок': 3 }
  };

  const sections = document.querySelectorAll('.nk-section_level_2, .nk-section_level_1 > .nk-section_level_2');
  if (sections.length === 0) return;

  let totalMoney = 0;
  let targetRowForTotal = null; // Здесь будем хранить самую верхнюю строку

  sections.forEach((section) => {
    const labelElement = section.querySelector('.nk-sidebar-control__label');
    if (!labelElement) return;
    
    const sectionName = labelElement.textContent.replace(/\u00A0/g, ' ').trim().toLowerCase();
    
    // Более гибкое сопоставление имени секции
    let sectionCoeffs = null;
    if (sectionName.includes('сообщения о неточностях') || sectionName.includes('неточност')) {
      sectionCoeffs = coefficients['сообщения о неточностях'];
    } else if (sectionName.includes('модерация')) {
      sectionCoeffs = coefficients['модерация'];
    }
    
    if (!sectionCoeffs) return;
    
    const statsRows = section.querySelectorAll('.nk-user-tasks-auto-manager-view__tasks-stats-row');
    
    statsRows.forEach((row) => {
      // Читаем только оригинальный текст (чтобы не прочитать спаны с деньгами)
      let originalText = '';
      for (let node of row.childNodes) {
        if (node.nodeType === 3) {
          originalText += node.textContent;
        }
      }
      originalText = originalText.replace(/\u00A0/g, ' ').trim();
      
      const match = originalText.match(/^(.+?):\s*(\d+)/);
      if (!match) return;
      
      const statName = match[1].trim().toLowerCase();
      const count = parseInt(match[2], 10);
      
      // Ищем коэффициент с гибким совпадением названия метрики
      let coeff = null;
      for (const [key, val] of Object.entries(sectionCoeffs)) {
        if (statName.includes(key) || key.includes(statName)) {
          coeff = val;
          break;
        }
      }
      
      if (!coeff) return;
      
      const rubles = Math.round(count * coeff);
      totalMoney += rubles; 
      
      let priceSpan = row.querySelector('.nk-money-span');
      if (!priceSpan) {
        priceSpan = document.createElement('span');
        priceSpan.className = 'nk-money-span';
        priceSpan.style.cssText = 'color: #FFC107; font-weight: bold; margin-left: 6px;';
        row.appendChild(priceSpan);
      }
      
      const newPriceText = `${rubles} ₽`;
      if (priceSpan.textContent !== newPriceText) {
        priceSpan.textContent = newPriceText;
      }

      // Запоминаем самую ПЕРВУЮ успешную строку
      if (!targetRowForTotal) {
        targetRowForTotal = row;
      }
    });
  });
  
  // Добавляем общую сумму в первую строку (в targetRowForTotal)
  if (totalMoney > 0 && targetRowForTotal) {
    let totalBlock = document.getElementById('nk-total-money-span');
    
    if (!totalBlock) {
      totalBlock = document.createElement('span');
      totalBlock.id = 'nk-total-money-span';
      totalBlock.style.cssText = 'color: #D84315; font-weight: bold; margin-left: 6px;';
      targetRowForTotal.appendChild(totalBlock); // Вставляем в конец первой строки
    }
    
    const newTotalText = `${totalMoney} ₽`;
    if (totalBlock.textContent !== newTotalText) {
      totalBlock.textContent = newTotalText;
    }
  }
}

// Запуск при инициализации и периодически каждые 1.5 секунды
// Это гарантирует, что сумма всегда отображается, даже если данные загрузились позже,
// при этом не нагружая систему MutationObserver-ом.
enhanceStatsWithPrices();
setInterval(enhanceStatsWithPrices, 1500);

document.addEventListener('click', (e) => {
  if (e.target.closest('.nk-tabs-bar__tab')) {
    setTimeout(enhanceStatsWithPrices, 200);
    setTimeout(enhanceStatsWithPrices, 800);
  }
}, { passive: true });
// Скрипт для добавления расчетов в рублях к статистике задач
function enhanceStatsWithPrices() {
  console.log('[StatsEnhancer] Запуск функции добавления стоимости...');
  
  const coefficients = {
    'сообщения о неточностях': {
      'сделано базовых': 6,
      'выполнено проверок': 6.5
    },
    'модерация': {
      'сделано базовых': 1.5,
      'выполнено проверок': 3
    }
  };

  const sections = document.querySelectorAll('.nk-section_level_1 > .nk-section_level_2');
  console.log(`[StatsEnhancer] Найдено секций: ${sections.length}`);
  
  sections.forEach((section, idx) => {
    const labelElement = section.querySelector('.nk-sidebar-control__label');
    if (!labelElement) {
      console.log(`[StatsEnhancer] Секция ${idx}: нет labelElement`);
      return;
    }
    
    const sectionName = labelElement.textContent.replace(/\u00A0/g, ' ').trim().toLowerCase();
    console.log(`[StatsEnhancer] Секция ${idx}: "${sectionName}"`);
    
    const sectionCoeffs = coefficients[sectionName];
    
    if (!sectionCoeffs) {
      console.log(`[StatsEnhancer] Секция ${idx}: нет коэффициентов для "${sectionName}"`);
      return;
    }
    
    const statsRows = section.querySelectorAll('.nk-user-tasks-auto-manager-view__tasks-stats-row');
    console.log(`[StatsEnhancer] Секция ${idx}: найдено строк статистики: ${statsRows.length}`);
    
    if (statsRows.length === 0) {
      // Попробуем альтернативные селекторы
      const altRows = section.querySelectorAll('[class*="stats-row"], [class*="task-row"]');
      console.log(`[StatsEnhancer] Секция ${idx}: альтернативный поиск нашел: ${altRows.length}`);
    }
    
    statsRows.forEach((row, rowIdx) => {
      const text = row.textContent.trim();
      console.log(`[StatsEnhancer] Строка ${rowIdx}: "${text}"`);
      
      // Проверяем, есть ли уже цена (чтобы не дублировать)
      if (text.includes('₽')) {
        // Обновляем существующую цену
        const match = text.match(/^(.+?):\s*(\d+)/);
        if (!match) return;
        
        const statName = match[1].trim().toLowerCase();
        const count = parseInt(match[2], 10);
        const coeff = sectionCoeffs[statName];
        if (!coeff) return;
        
        const rubles = Math.round(count * coeff);
        row.innerHTML = `${match[1]}: ${count} <span style="color: #FFC107; margin-left: 4px;">${rubles} ₽</span>`;
        console.log(`[StatsEnhancer] ✅ Обновлена цена для "${statName}": ${rubles} ₽`);
        return;
      }
      
      const match = text.match(/^(.+?):\s*(\d+)/);
      if (!match) {
        console.log(`[StatsEnhancer] Строка ${rowIdx}: не соответствует паттерну`);
        return;
      }
      
      const statName = match[1].trim().toLowerCase();
      const count = parseInt(match[2], 10);
      
      const coeff = sectionCoeffs[statName];
      if (!coeff) {
        console.log(`[StatsEnhancer] Строка ${rowIdx}: нет коэффициента для "${statName}"`);
        return;
      }
      
      const rubles = Math.round(count * coeff);
      
      row.innerHTML = `${match[1]}: ${count} <span style="color: #FFC107; margin-left: 4px;">${rubles} ₽</span>`;
      console.log(`[StatsEnhancer] ✅ Добавлена цена для "${statName}": ${rubles} ₽`);
    });
  });
  
  console.log('[StatsEnhancer] Завершение функции');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(enhanceStatsWithPrices, 1000);
  });
} else {
  setTimeout(enhanceStatsWithPrices, 1000);
}

let statsEnhancerTimeout;
let statsEnhancerLastRun = 0;
const STATS_ENHANCER_MIN_INTERVAL = 3000; // Минимум 3 секунды между срабатываниями
const STATS_ENHANCER_DEBOUNCE = 2000; // Debounce 2 секунды
let statsEnhancerPending = false;

const statsObserver = new MutationObserver((mutations) => {
  // Жесткое ограничение - не чаще 1 раза в 3 секунды
  const now = Date.now();
  const timeSinceLastRun = now - statsEnhancerLastRun;
  
  if (timeSinceLastRun < STATS_ENHANCER_MIN_INTERVAL) {
    return; // Пропускаем если слишком рано
  }
  
  // Если уже запланирован запуск, не планируем новый
  if (statsEnhancerPending) {
    return;
  }
  
  // Более строгая фильтрация
  const hasStatsChanges = mutations.some(mutation => {
    // Игнорируем изменения атрибутов и текста
    if (mutation.type !== 'childList') {
      return false;
    }
    
    return Array.from(mutation.addedNodes).some(node => {
      if (node.nodeType !== 1) return false; // Только элементы
      
      // Проверяем только релевантные элементы
      return node.classList?.contains('nk-sidebar-view') ||
             node.classList?.contains('nk-user-tasks-auto-manager-view__tasks-stats-row') ||
             node.querySelector?.('.nk-user-tasks-auto-manager-view__tasks-stats-row');
    });
  });
  
  if (!hasStatsChanges) {
    return; // Пропускаем нерелевантные изменения
  }
  
  statsEnhancerPending = true;
  clearTimeout(statsEnhancerTimeout);
  statsEnhancerTimeout = setTimeout(() => {
    statsEnhancerLastRun = Date.now();
    statsEnhancerPending = false;
    enhanceStatsWithPrices();
  }, STATS_ENHANCER_DEBOUNCE);
});

setTimeout(() => {
  const targetNode = document.body;
  if (targetNode) {
    console.log('[StatsEnhancer] Запуск MutationObserver (постоянный)');
    statsObserver.observe(targetNode, {
      childList: true,
      subtree: true,
      // Отключаем отслеживание атрибутов и текста
      attributes: false,
      characterData: false
    });
  }
}, 2000);

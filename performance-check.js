// Скрипт для диагностики производительности расширения
console.log('[Performance] Начало мониторинга производительности...');

const performanceCounters = {
  mutationObservers: 0,
  lastReset: Date.now()
};

setInterval(() => {
  const elapsed = (Date.now() - performanceCounters.lastReset) / 1000;
  
  // Логируем только если есть проблемы
  if (performanceCounters.mutationObservers > 100) {
    console.warn(`[Performance] ⚠️ ВНИМАНИЕ: Слишком много срабатываний MutationObserver за ${elapsed.toFixed(1)} сек: ${performanceCounters.mutationObservers}`);
  } else if (performanceCounters.mutationObservers > 50) {
    console.log(`[Performance] ℹ️ MutationObserver работает активно: ${performanceCounters.mutationObservers} за ${elapsed.toFixed(1)} сек`);
  }
  // Не логируем если все в норме (< 50 срабатываний)
  
  performanceCounters.mutationObservers = 0;
  performanceCounters.lastReset = Date.now();
}, 10000); // Проверяем каждые 10 секунд вместо 5

const OriginalMutationObserver = window.MutationObserver;
let lastObserverCall = 0;
const MIN_OBSERVER_INTERVAL = 100; // Минимум 100мс между вызовами

window.MutationObserver = function(callback) {
  return new OriginalMutationObserver(function(mutations, observer) {
    const now = Date.now();
    
    // Ограничиваем частоту вызовов
    if (now - lastObserverCall < MIN_OBSERVER_INTERVAL) {
      return; // Пропускаем слишком частые вызовы
    }
    
    lastObserverCall = now;
    performanceCounters.mutationObservers++;
    return callback.call(this, mutations, observer);
  });
};
window.MutationObserver.prototype = OriginalMutationObserver.prototype;

console.log('[Performance] Мониторинг запущен. Проверяйте консоль каждые 10 секунд.');

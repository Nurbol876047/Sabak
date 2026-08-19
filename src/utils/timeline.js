export function buildTimeline(scenario, activities, targetDuration) {
  if (!scenario) return { items: [], totalDuration: 0, targetDuration: parseInt(targetDuration) || 45 };

  const items = [];
  let currentMinute = 0;

  // Функция для безопасного извлечения минут из строки вида "10 минут", "10", "10-15"
  const parseDuration = (durStr, defaultVal = 5) => {
    if (!durStr) return defaultVal;
    const match = String(durStr).match(/\d+/);
    return match ? parseInt(match[0], 10) : defaultVal;
  };

  // 1. Вступление
  const introDuration = 5;
  items.push({
    startMinute: currentMinute,
    endMinute: currentMinute + introDuration,
    time: `${currentMinute}-${currentMinute + introDuration} мин`,
    title: 'Вступление',
    type: 'intro',
    description: scenario.intro || 'Вступительное слово'
  });
  currentMinute += introDuration;

  // 2. Основные задания (из activities или main_parts)
  // В идеале мы используем activities, так как они более детализированы.
  // Если activities почему-то нет, фоллбэчимся на main_parts сценария.
  const mainItems = (activities && activities.length > 0) 
    ? activities 
    : (scenario.main_parts || []);

  mainItems.forEach((item, idx) => {
    const dur = parseDuration(item.duration, 10);
    items.push({
      startMinute: currentMinute,
      endMinute: currentMinute + dur,
      time: `${currentMinute}-${currentMinute + dur} мин`,
      title: item.title || `Этап ${idx + 1}`,
      type: 'activity',
      description: item.description || item.teacher_action || ''
    });
    currentMinute += dur;
  });

  // 3. Заключение
  const conclusionDuration = 5;
  items.push({
    startMinute: currentMinute,
    endMinute: currentMinute + conclusionDuration,
    time: `${currentMinute}-${currentMinute + conclusionDuration} мин`,
    title: 'Заключение и рефлексия',
    type: 'conclusion',
    description: scenario.conclusion || 'Заключительное слово'
  });
  currentMinute += conclusionDuration;

  return {
    items,
    totalDuration: currentMinute,
    targetDuration: parseInt(targetDuration) || 45
  };
}

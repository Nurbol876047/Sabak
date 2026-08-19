const STORAGE_KEY = 'chemodan_plans';

function getStoragePlans() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return [];
  }
}

function setStoragePlans(plans) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
    throw new Error('Не удалось сохранить данные. Возможно, переполнена память браузера.');
  }
}

export const planStorage = {
  savePlan(plan) {
    const plans = getStoragePlans();
    
    if (plan.id) {
      // Обновляем существующий
      const index = plans.findIndex(p => p.id === plan.id);
      if (index !== -1) {
        plans[index] = { ...plans[index], ...plan, updatedAt: new Date().toISOString() };
      } else {
        plans.unshift({ ...plan, updatedAt: new Date().toISOString() });
      }
    } else {
      // Создаем новый
      const newPlan = {
        ...plan,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      plans.unshift(newPlan);
      plan.id = newPlan.id; // Mutating input just to give back ID
    }

    setStoragePlans(plans);
    return plan.id;
  },

  getPlan(id) {
    const plans = getStoragePlans();
    return plans.find(p => p.id === id) || null;
  },

  listPlans() {
    const plans = getStoragePlans();
    // Возвращаем краткую информацию
    return plans.map(p => ({
      id: p.id,
      title: p.title || 'Без названия',
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      duration: p.params?.duration || '45',
      target: p.params?.age || 'Не указан',
      type: p.type || 'lesson',
    }));
  },

  deletePlan(id) {
    let plans = getStoragePlans();
    plans = plans.filter(p => p.id !== id);
    setStoragePlans(plans);
  }
};

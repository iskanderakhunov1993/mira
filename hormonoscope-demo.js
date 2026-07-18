const phases = {
  menstrual: {
    title: 'Менструация',
    card: 'Сегодня особенно важен комфорт и спокойный темп',
    signals: ['Энергия ↘', 'Комфорт важен', 'Сон ↗'],
    prediction: 'Организму может хотеться больше отдыха',
    description: 'В начале цикла уровни эстрогена и прогестерона обычно низкие. Самочувствие сильно различается: ориентируйтесь на свои ощущения.',
    energy: 'Может снижаться', appetite: 'Индивидуально', mood: 'Нужен комфорт',
    tryTitle: 'Добавить тепла и отдыха', tryText: 'Тёплый душ, вода и комфортная активность могут поддержать самочувствие.',
    byeTitle: 'Не терпеть сильную боль', byeText: 'Если боль необычная, усиливается или мешает жизни, лучше обратиться за помощью.'
  },
  follicular: {
    title: 'Фолликулярная фаза',
    card: 'Энергия может постепенно возвращаться',
    signals: ['Энергия ↗', 'Фокус ↗', 'Аппетит →'],
    prediction: 'Может появиться больше ресурса для дел',
    description: 'После месячных уровень эстрогена обычно начинает расти. Это не гарантирует прилив сил, но можно проверить, как реагируете именно вы.',
    energy: 'Может расти', appetite: 'Стабильнее', mood: 'Индивидуально',
    tryTitle: 'Начать одно новое дело', tryText: 'Если чувствуете ресурс, используйте его для задачи, которую давно откладывали.',
    byeTitle: 'Не ждать обязательного подъёма', byeText: 'Нормально чувствовать усталость и в этой фазе — дневник важнее общего прогноза.'
  },
  ovulation: {
    title: 'Предполагаемая овуляция',
    card: 'Можно внимательнее наблюдать за сигналами тела',
    signals: ['Энергия →', 'Общение ↗', 'Тело ↗'],
    prediction: 'День для наблюдения, а не уверенного вывода',
    description: 'Календарь предполагает середину цикла, но не может подтвердить овуляцию. Телесные признаки и самочувствие могут отличаться.',
    energy: 'Индивидуально', appetite: 'Может снижаться', mood: 'Может меняться',
    tryTitle: 'Отметить сигналы тела', tryText: 'Запишите выделения, самочувствие и энергию — это поможет увидеть личную картину.',
    byeTitle: 'Не считать день безопасным', byeText: 'Календарный прогноз овуляции нельзя использовать как подтверждение контрацептивной безопасности.'
  },
  luteal: {
    title: 'Лютеиновая фаза',
    card: 'Сегодня может хотеться более спокойного темпа',
    signals: ['Энергия ↘', 'Аппетит ↗', 'Фокус →'],
    prediction: 'Темп может стать спокойнее',
    description: 'После предполагаемой овуляции меняется гормональный фон. У некоторых в этот период меняются аппетит, сон или эмоциональная чувствительность.',
    energy: 'Спокойнее', appetite: 'Может расти', mood: 'Чувствительнее',
    tryTitle: 'Оставить запас времени', tryText: 'Регулярная еда и небольшие перерывы могут сделать день комфортнее.',
    byeTitle: 'Не перегружать расписание', byeText: 'Необязательно выполнять всё в привычном темпе, если самочувствие изменилось.'
  }
};

const $ = (id) => document.getElementById(id);
let current = 'luteal';
function render(phase) {
  current = phase;
  const data = phases[phase];
  $('cardTitle').textContent = data.title;
  $('cardText').textContent = data.card;
  $('signals').innerHTML = data.signals.map(item => `<i>${item}</i>`).join('');
  $('sheetTitle').textContent = data.title;
  $('sheetPrediction').textContent = data.prediction;
  $('sheetDescription').textContent = data.description;
  $('energyValue').textContent = data.energy;
  $('appetiteValue').textContent = data.appetite;
  $('moodValue').textContent = data.mood;
  $('tryTitle').textContent = data.tryTitle;
  $('tryText').textContent = data.tryText;
  $('byeTitle').textContent = data.byeTitle;
  $('byeText').textContent = data.byeText;
  document.querySelectorAll('[data-phase]').forEach(button => button.classList.toggle('active', button.dataset.phase === phase));
}
function openSheet() {
  $('sheet').classList.add('open');
  $('backdrop').classList.add('open');
  $('sheet').setAttribute('aria-hidden', 'false');
}
function closeSheet() {
  $('sheet').classList.remove('open');
  $('backdrop').classList.remove('open');
  $('sheet').setAttribute('aria-hidden', 'true');
}
document.querySelectorAll('[data-phase]').forEach(button => button.addEventListener('click', () => render(button.dataset.phase)));
$('openCard').addEventListener('click', openSheet);
$('closeSheet').addEventListener('click', closeSheet);
$('backdrop').addEventListener('click', closeSheet);
document.querySelectorAll('.feedback button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.feedback button').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  button.textContent = '✓ ' + button.textContent.replace('✓ ', '');
}));
render(current);

const tabs = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('.panel');
tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(item => item.classList.remove('active'));
  panels.forEach(item => item.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById(tab.dataset.tab).classList.add('active');
}));
const backdrop = document.querySelector('.backdrop');
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
  document.getElementById(button.dataset.open).classList.add('open');
  backdrop.classList.add('open');
}));
function closeSheets() {
  document.querySelectorAll('.sheet').forEach(sheet => sheet.classList.remove('open'));
  backdrop.classList.remove('open');
}
document.querySelectorAll('.close,.done').forEach(button => button.addEventListener('click', closeSheets));
backdrop.addEventListener('click', closeSheets);
document.querySelectorAll('.check button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.check button').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  button.style.color = '#fff';
  button.style.background = '#c65388';
}));

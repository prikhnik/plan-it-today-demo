const DURATION = 2200;
let timer;

export function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.add('toast--visible');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('toast--visible'), DURATION);
}

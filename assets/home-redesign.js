function initHomeCategorySwitcher(section) {
  const tabs = [...section.querySelectorAll('[data-home-category-tab]')];
  const panel = section.querySelector('[role="tabpanel"]');
  const image = section.querySelector('[data-home-category-image]');
  const link = section.querySelector('[data-home-category-link]');
  if (!tabs.length || !panel || !image || !link) return;
  function activate(tab) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    if (tab.dataset.categoryImage) image.src = tab.dataset.categoryImage;
    image.alt = tab.dataset.categoryTitle || '';
    link.href = tab.dataset.categoryUrl || '/collections/all';
    panel.setAttribute('aria-labelledby', tab.id);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') activate(tab);
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const next = (index + ((event.key === 'ArrowDown' || event.key === 'ArrowRight') ? 1 : -1) + tabs.length) % tabs.length;
      activate(tabs[next]);
      tabs[next].focus();
    });
  });
  activate(tabs[0]);
}
document.querySelectorAll('[data-home-categories]').forEach(initHomeCategorySwitcher);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-home-categories]').forEach(initHomeCategorySwitcher);
});

function initYkHero(section) {
  const slides = [...section.querySelectorAll('[data-yk-hero-slide]')];
  const current = section.querySelector('[data-yk-hero-current]');
  if (slides.length < 2 || section.dataset.ykHeroReady) return;
  section.dataset.ykHeroReady = 'true';
  let index = 0;
  let timer;
  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.toggleAttribute('inert', !active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    if (current) current.textContent = String(index + 1);
  }
  function restart() {
    clearInterval(timer);
    if (section.dataset.autoplay === 'true') timer = setInterval(() => show(index + 1), Number(section.dataset.autoplayDelay) || 6000);
  }
  section.querySelector('[data-yk-hero-prev]')?.addEventListener('click', () => { show(index - 1); restart(); });
  section.querySelector('[data-yk-hero-next]')?.addEventListener('click', () => { show(index + 1); restart(); });
  let startX = null;
  section.addEventListener('touchstart', (event) => { startX = event.touches[0].clientX; }, { passive: true });
  section.addEventListener('touchend', (event) => {
    if (startX === null) return;
    const delta = event.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(delta) > 40) { show(index + (delta < 0 ? 1 : -1)); restart(); }
  });
  restart();
}
document.querySelectorAll('[data-yk-hero]').forEach(initYkHero);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-hero]').forEach(initYkHero);
});

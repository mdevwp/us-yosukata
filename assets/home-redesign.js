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

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

function initYkOffers(section) {
  const track = section.querySelector('[data-yk-offers-track]');
  if (!track || track.dataset.ready) return;
  track.dataset.ready = 'true';

  const cards = Array.from(track.children);
  const nav = section.querySelector('[data-yk-offers-nav]');
  const prev = section.querySelector('[data-yk-offers-prev]');
  const next = section.querySelector('[data-yk-offers-next]');
  const current = section.querySelector('[data-yk-offers-current]');
  const total = section.querySelector('[data-yk-offers-total]');
  const thumb = section.querySelector('[data-yk-offers-thumb]');
  const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth);

  const update = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    const atEnd = track.scrollLeft >= maxScroll - 2;
    const index = atEnd ? cards.length - 1 : Math.round(track.scrollLeft / step());
    nav.hidden = maxScroll <= 2;
    current.textContent = index + 1;
    total.textContent = cards.length;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = atEnd;
    if (thumb) {
      thumb.style.width = `${100 / cards.length}%`;
      thumb.style.transform = `translateX(${index * 100}%)`;
    }
  };

  const goTo = (direction) => {
    const index = Math.round(track.scrollLeft / step()) + direction;
    track.scrollTo({ left: Math.max(0, index) * step(), behavior: 'smooth' });
  };

  prev.addEventListener('click', () => goTo(-1));
  next.addEventListener('click', () => goTo(1));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  section.querySelectorAll('[data-yk-quick-add]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const button = form.querySelector('button');
      button.classList.add('is-loading');
      fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Add to cart failed');
          document.dispatchEvent(new CustomEvent('apps:product-added-to-cart'));
          const cartIcon = Array.from(document.querySelectorAll('[data-js-cart-icon]')).find((icon) => icon.offsetParent);
          if (document.querySelector('.quick-cart') && cartIcon) {
            window.setTimeout(() => cartIcon.click(), 300);
          } else {
            window.location.href = `${window.Shopify?.routes?.root || '/'}cart`;
          }
        })
        .catch(() => form.submit())
        .finally(() => button.classList.remove('is-loading'));
    });
  });
}

document.querySelectorAll('[data-yk-offers]').forEach(initYkOffers);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-offers]').forEach(initYkOffers);
});

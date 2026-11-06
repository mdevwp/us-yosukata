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
    tab.addEventListener('click', () => {
      // Desktop: tabs switch on hover, so a click opens the category page
      if (window.matchMedia('(min-width: 960px)').matches && tab.dataset.categoryUrl) {
        window.location.href = tab.dataset.categoryUrl;
        return;
      }
      activate(tab);
    });
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
  const prev = section.querySelector('[data-yk-hero-prev]');
  const next = section.querySelector('[data-yk-hero-next]');
  // Arrows and swipes stop at the first and last slide; autoplay loops
  function go(target) {
    if (target < 0 || target > slides.length - 1) return;
    show(target);
    restart();
  }
  function show(target) {
    index = (target + slides.length) % slides.length;
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === slides.length - 1;
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
  prev?.addEventListener('click', () => go(index - 1));
  next?.addEventListener('click', () => go(index + 1));
  // Mouse drag on desktop
  let dragX = null;
  section.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('a, button')) return;
    dragX = event.clientX;
  });
  window.addEventListener('pointerup', (event) => {
    if (dragX === null) return;
    const delta = event.clientX - dragX;
    dragX = null;
    section.classList.remove('yk-is-dragging');
    if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
  });
  section.addEventListener('pointermove', (event) => {
    if (dragX !== null && Math.abs(event.clientX - dragX) > 5) section.classList.add('yk-is-dragging');
  });
  section.addEventListener('dragstart', (event) => event.preventDefault());
  let startX = null;
  section.addEventListener('touchstart', (event) => { startX = event.touches[0].clientX; }, { passive: true });
  section.addEventListener('touchend', (event) => {
    if (startX === null) return;
    const delta = event.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
  });
  show(0);
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
  initYkDragScroll(track);
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

function initYkSeason(section) {
  const track = section.querySelector('[data-yk-season-track]');
  const dots = section.querySelectorAll('.yk-season__dot');
  if (!track || !dots.length || track.dataset.ready) return;
  track.dataset.ready = 'true';
  const update = () => {
    const index = Math.round(track.scrollLeft / (track.clientWidth || 1));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };
  track.addEventListener('scroll', update, { passive: true });
}

document.querySelectorAll('[data-yk-season]').forEach(initYkSeason);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-season]').forEach(initYkSeason);
});

function initYkReviews(section) {
  const track = section.querySelector('[data-yk-reviews-track]');
  if (!track || track.dataset.ready) return;
  track.dataset.ready = 'true';

  const cards = Array.from(track.children);
  const dots = section.querySelectorAll('.yk-reviews__dot');
  const prev = section.querySelector('[data-yk-reviews-prev]');
  const next = section.querySelector('[data-yk-reviews-next]');
  const current = section.querySelector('[data-yk-reviews-current]');
  const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth);

  const update = () => {
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    const index = atEnd ? cards.length - 1 : Math.round(track.scrollLeft / step());
    if (current) current.textContent = index + 1;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = atEnd;
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };

  const goTo = (direction) => {
    const index = Math.round(track.scrollLeft / step()) + direction;
    track.scrollTo({ left: Math.max(0, index) * step(), behavior: 'smooth' });
  };

  if (prev) prev.addEventListener('click', () => goTo(-1));
  if (next) next.addEventListener('click', () => goTo(1));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

document.querySelectorAll('[data-yk-reviews]').forEach(initYkReviews);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-reviews]').forEach(initYkReviews);
});

function initYkSet(section) {
  const track = section.querySelector('[data-yk-set-track]');
  if (!track || track.dataset.ready) return;
  track.dataset.ready = 'true';

  const items = Array.from(track.children);
  const hotspots = section.querySelectorAll('[data-yk-set-hotspot]');
  const dots = section.querySelectorAll('.yk-set__dot');
  const prev = section.querySelector('[data-yk-set-prev]');
  const next = section.querySelector('[data-yk-set-next]');
  const current = section.querySelector('[data-yk-set-current]');
  const step = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth);

  const setActive = (index) => {
    hotspots.forEach((hotspot, i) => hotspot.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    if (current) current.textContent = index + 1;
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === items.length - 1;
  };
  const goTo = (index) => {
    const target = Math.max(0, Math.min(items.length - 1, index));
    track.scrollTo({ left: target * step(), behavior: 'smooth' });
    setActive(target);
  };

  hotspots.forEach((hotspot) => hotspot.addEventListener('click', () => goTo(Number(hotspot.dataset.ykSetHotspot))));
  if (prev) prev.addEventListener('click', () => goTo(Math.round(track.scrollLeft / step()) - 1));
  if (next) next.addEventListener('click', () => goTo(Math.round(track.scrollLeft / step()) + 1));
  track.addEventListener('scroll', () => setActive(Math.round(track.scrollLeft / step())), { passive: true });
  setActive(0);
}

document.querySelectorAll('[data-yk-set]').forEach(initYkSet);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-set]').forEach(initYkSet);
});

function initYkCommunity(section) {
  const track = section.querySelector('[data-yk-community-track]');
  const dots = section.querySelectorAll('.yk-community__dot');
  if (!track || !dots.length || track.dataset.ready) return;
  track.dataset.ready = 'true';
  const update = () => {
    const index = Math.round(track.scrollLeft / (track.clientWidth || 1));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };
  track.addEventListener('scroll', update, { passive: true });
}

document.querySelectorAll('[data-yk-community]').forEach(initYkCommunity);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-community]').forEach(initYkCommunity);
});

function initYkChefs(section) {
  const track = section.querySelector('[data-yk-chefs-track]');
  if (!track || track.dataset.ready) return;
  track.dataset.ready = 'true';

  const slides = Array.from(track.children);
  const dots = section.querySelectorAll('.yk-chefs__dot');
  const prev = section.querySelector('[data-yk-chefs-prev]');
  const next = section.querySelector('[data-yk-chefs-next]');
  const current = section.querySelector('[data-yk-chefs-current]');
  const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth);

  const setActive = (index) => {
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    if (current) current.textContent = index + 1;
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === slides.length - 1;
  };
  const goTo = (index) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({ left: target * step(), behavior: 'smooth' });
    setActive(target);
  };

  if (prev) prev.addEventListener('click', () => goTo(Math.round(track.scrollLeft / step()) - 1));
  if (next) next.addEventListener('click', () => goTo(Math.round(track.scrollLeft / step()) + 1));
  track.addEventListener('scroll', () => setActive(Math.round(track.scrollLeft / step())), { passive: true });
  setActive(0);
}

document.querySelectorAll('[data-yk-chefs]').forEach(initYkChefs);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-chefs]').forEach(initYkChefs);
});

// FAQ: keep one answer open. Details with a shared name do this natively; this covers older browsers
document.addEventListener('toggle', (event) => {
  const item = event.target;
  if (!item.matches || !item.matches('.yk-faq__item') || !item.open) return;
  item.closest('.yk-faq__list').querySelectorAll('.yk-faq__item[open]').forEach((other) => {
    if (other !== item) other.open = false;
  });
}, true);

// Mouse drag for the scrolling sliders (touch devices already swipe natively)
function initYkDragScroll(track) {
  if (track.dataset.ykDrag) return;
  track.dataset.ykDrag = 'true';
  let startX = 0;
  let startScroll = 0;
  let pointerId = null;
  let moved = false;
  let glide = 0;

  const snapToNearest = () => {
    const items = Array.from(track.children);
    const step = items[1] ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth;
    const startIndex = Math.round(startScroll / (step || 1));
    let index = Math.round(track.scrollLeft / (step || 1));
    // A short drag still moves one slide in the drag direction (wide slides need this)
    const dragged = track.scrollLeft - startScroll;
    if (index === startIndex && Math.abs(dragged) > 50) index += dragged > 0 ? 1 : -1;
    index = Math.max(0, Math.min(items.length - 1, index));
    const target = index * step;
    track.classList.remove('yk-is-dragging');
    // Glide to the slide with snapping off, then turn snapping back on
    const from = track.scrollLeft;
    const to = Math.min(target, track.scrollWidth - track.clientWidth);
    const started = performance.now();
    const duration = 300;
    const frame = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - progress) ** 3;
      track.scrollLeft = from + (to - from) * eased;
      if (progress < 1) {
        glide = window.requestAnimationFrame(frame);
      } else {
        track.classList.remove('yk-no-snap');
      }
    };
    glide = window.requestAnimationFrame(frame);
  };

  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (track.scrollWidth <= track.clientWidth + 2) return;
    if (event.target.closest('button, input, select, textarea, form')) return;
    window.cancelAnimationFrame(glide);
    pointerId = event.pointerId;
    startX = event.clientX;
    startScroll = track.scrollLeft;
    moved = false;
  });
  track.addEventListener('pointermove', (event) => {
    if (pointerId !== event.pointerId) return;
    const delta = event.clientX - startX;
    if (!moved && Math.abs(delta) < 6) return;
    if (!moved) {
      moved = true;
      track.classList.add('yk-no-snap');
      try { track.setPointerCapture(pointerId); } catch (error) { /* pointer already released */ }
      track.classList.add('yk-is-dragging');
    }
    track.scrollLeft = startScroll - delta;
  });
  const end = (event) => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    if (moved) snapToNearest();
    else track.classList.remove('yk-no-snap');
  };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  // A drag must not open the product the mouse was released on
  track.addEventListener('click', (event) => {
    if (moved) {
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }
  }, true);
  track.addEventListener('dragstart', (event) => event.preventDefault());
}

const ykDragTracks = '[data-yk-offers-track], [data-yk-reviews-track], [data-yk-set-track], [data-yk-chefs-track], [data-yk-season-track], [data-yk-community-track]';
document.querySelectorAll(ykDragTracks).forEach(initYkDragScroll);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll(ykDragTracks).forEach(initYkDragScroll);
});

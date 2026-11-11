/* Redesign 2026: product page */
function initYkGallery(gallery) {
  if (!gallery || gallery.dataset.ready) return;
  gallery.dataset.ready = 'true';

  const main = gallery.querySelector('[data-yk-gallery-main]');
  const track = gallery.querySelector('[data-yk-gallery-track]');
  const slides = Array.from(track.children);
  const current = gallery.querySelector('[data-yk-gallery-current]');
  const prev = gallery.querySelector('[data-yk-gallery-prev]');
  const next = gallery.querySelector('[data-yk-gallery-next]');
  const dots = Array.from(gallery.querySelectorAll('.yk-gallery__dot'));
  const thumbs = Array.from(gallery.querySelectorAll('[data-yk-gallery-thumb]'));
  const thumbList = gallery.querySelector('[data-yk-gallery-thumbs]');
  const more = gallery.querySelector('[data-yk-gallery-more]');
  const zoom = gallery.querySelector('[data-yk-gallery-zoom]');
  const lens = gallery.querySelector('[data-yk-gallery-lens]');
  let index = 0;

  const setActive = (target) => {
    index = target;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      if (i === index) slide.removeAttribute('aria-hidden');
      else slide.setAttribute('aria-hidden', 'true');
    });
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    thumbs.forEach((thumb, i) => thumb.classList.toggle('is-active', i === index));
    if (current) current.textContent = index + 1;
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === slides.length - 1;
    if (thumbList && index > 3) thumbList.classList.remove('is-collapsed');
  };

  const goTo = (target, smooth = true) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, target));
    setZoom(false);
    track.scrollTo({ left: clamped * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    setActive(clamped);
  };

  const setZoom = (on) => {
    if (!zoom) return;
    main.classList.toggle('is-zoomed', on);
    zoom.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!on) slides.forEach((slide) => slide.querySelector('.yk-gallery__image')?.style.removeProperty('transform-origin'));
  };

  const moveZoom = (event) => {
    if (!main.classList.contains('is-zoomed')) return;
    const rect = main.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const image = slides[index].querySelector('.yk-gallery__image');
    if (image) image.style.transformOrigin = `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`;
    if (lens) {
      lens.style.setProperty('--yk-lens-x', `${x}px`);
      lens.style.setProperty('--yk-lens-y', `${y}px`);
    }
  };

  if (prev) prev.addEventListener('click', () => goTo(index - 1));
  if (next) next.addEventListener('click', () => goTo(index + 1));
  thumbs.forEach((thumb) => thumb.addEventListener('click', () => goTo(Number(thumb.dataset.ykGalleryThumb))));
  if (more) more.addEventListener('click', () => thumbList.classList.remove('is-collapsed'));
  track.addEventListener('scroll', () => {
    const target = Math.round(track.scrollLeft / track.clientWidth);
    if (target !== index) setActive(target);
  }, { passive: true });

  if (zoom) {
    zoom.addEventListener('click', (event) => {
      event.stopPropagation();
      const rect = main.getBoundingClientRect();
      setZoom(true);
      moveZoom({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 });
    });
    main.addEventListener('click', (event) => {
      if (event.target.closest('button, a, video, iframe, model-viewer')) return;
      if (!slides[index].classList.contains('yk-gallery__slide--image')) return;
      const zoomed = !main.classList.contains('is-zoomed');
      setZoom(zoomed);
      if (zoomed) moveZoom(event);
    });
    main.addEventListener('pointermove', moveZoom);
    main.addEventListener('pointerleave', () => setZoom(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setZoom(false);
    });
  }

  gallery.ykGoToMedia = (mediaId) => {
    const target = slides.findIndex((slide) => slide.dataset.mediaId === String(mediaId));
    if (target > -1) goTo(target, false);
  };

  setActive(0);
}

function initYkProduct(section) {
  if (!section || section.dataset.ready) return;
  section.dataset.ready = 'true';

  const root = window.Shopify?.routes?.root || '/';
  const form = section.querySelector('[data-yk-product-form]');
  const addButton = section.querySelector('[data-yk-add]');
  const error = section.querySelector('[data-yk-buy-error]');
  const gallery = section.querySelector('[data-yk-gallery]');
  initYkGallery(gallery);

  // Add to cart without leaving the page, then open the cart drawer like the homepage quick add
  if (form && addButton) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const quantity = section.querySelector('[data-yk-qty] input');
      if (quantity) data.set('quantity', quantity.value);
      addButton.classList.add('is-loading');
      if (error) error.hidden = true;
      fetch(`${root}cart/add.js`, { method: 'POST', headers: { Accept: 'application/json' }, body: data })
        .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
        .then(({ ok, body }) => {
          if (!ok) throw new Error(body.description || body.message || 'Add to cart failed');
          document.dispatchEvent(new CustomEvent('apps:product-added-to-cart'));
          const cartIcon = Array.from(document.querySelectorAll('[data-js-cart-icon]')).find((icon) => icon.offsetParent);
          if (document.querySelector('.quick-cart') && cartIcon) {
            window.setTimeout(() => cartIcon.click(), 300);
          } else {
            window.location.href = `${root}cart`;
          }
        })
        .catch((err) => {
          if (error) {
            error.textContent = err.message;
            error.hidden = false;
          }
        })
        .finally(() => addButton.classList.remove('is-loading'));
    });
  }

  section.querySelectorAll('[data-yk-qty]').forEach((qty) => {
    const input = qty.querySelector('input');
    qty.querySelectorAll('[data-yk-qty-step]').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = Math.max(1, (Number(input.value) || 1) + Number(button.dataset.ykQtyStep));
      });
    });
  });

  // Variant picker: only rendered for products with several variants
  const picker = section.querySelector('[data-yk-variant-picker]');
  if (picker) {
    const variants = JSON.parse(picker.querySelector('[data-yk-variants]').textContent);
    const price = section.querySelector('[data-yk-price]');
    const money = (cents) => {
      const format = window.theme?.moneyFormat || window.Shopify?.money_format || '${{amount}}';
      return format.replace(/\{\{\s*(\w+)\s*\}\}/, (match, key) => {
        const value = (cents / 100).toFixed(key.includes('no_decimals') ? 0 : 2);
        return key.includes('comma') ? value.replace('.', ',') : value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      });
    };

    picker.addEventListener('change', () => {
      const selected = Array.from(picker.querySelectorAll('fieldset')).map((fieldset) => fieldset.querySelector('input:checked')?.value);
      const variant = variants.find((item) => item.options.every((value, i) => value === selected[i]));
      section.querySelectorAll('[data-yk-buy-available]').forEach((el) => { el.hidden = !(variant && variant.available); });
      section.querySelectorAll('[data-yk-buy-sold-out]').forEach((el) => { el.hidden = Boolean(variant && variant.available); });
      if (!variant) return;
      section.querySelectorAll('[data-yk-variant-id]').forEach((input) => { input.value = variant.id; });
      if (price) {
        price.innerHTML = variant.compare_at_price > variant.price
          ? `${money(variant.price)} <s class="yk-product__compare">${money(variant.compare_at_price)}</s>`
          : money(variant.price);
      }
      if (variant.featured_media && gallery?.ykGoToMedia) gallery.ykGoToMedia(variant.featured_media.id);
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    });
  }

  // Notify me popup (sold out)
  const dialog = section.querySelector('[data-yk-notify]');
  if (dialog) {
    const email = dialog.querySelector('[data-yk-notify-email]');
    const submit = dialog.querySelector('[data-yk-notify-submit]');
    const body = dialog.querySelector('[data-yk-notify-body]');
    section.querySelectorAll('[data-yk-notify-open]').forEach((button) => {
      button.addEventListener('click', () => {
        if (body) {
          const variantInput = section.querySelector('[data-yk-variant-id]');
          body.value = `${body.value.split(' Variant:')[0]}${variantInput ? ` Variant: ${variantInput.value}` : ''}`;
        }
        dialog.showModal();
      });
    });
    dialog.querySelector('[data-yk-notify-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    if (email && submit) {
      email.addEventListener('input', () => { submit.disabled = !email.validity.valid || !email.value; });
    }
    if (dialog.querySelector('[data-yk-notify-success], .yk-notify__error')) dialog.showModal();
  }
}

document.querySelectorAll('[data-yk-product]').forEach(initYkProduct);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-product]').forEach(initYkProduct);
});

function initYkDetails(section) {
  if (!section || section.dataset.ready) return;
  section.dataset.ready = 'true';

  const tabs = Array.from(section.querySelectorAll('[data-yk-tab]'));
  const select = (tab, focus) => {
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      select(tabs[(i + step + tabs.length) % tabs.length], true);
    });
  });

  section.querySelectorAll('[data-yk-video]').forEach((wrapper) => {
    const video = wrapper.querySelector('video');
    const toggle = wrapper.querySelector('[data-yk-video-toggle]');
    if (!video || !toggle) return;
    const sync = () => {
      wrapper.classList.toggle('is-paused', video.paused);
      toggle.setAttribute('aria-label', video.paused ? toggle.dataset.labelPlay : toggle.dataset.labelPause);
    };
    toggle.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
    sync();
  });
}

function initYkRecs(section) {
  if (!section || section.dataset.ready || section.hasAttribute('data-yk-offers')) return;
  section.dataset.ready = 'true';
  fetch(section.dataset.url)
    .then((response) => response.text())
    .then((html) => {
      const fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-yk-recs]');
      const fallback = section.querySelector('[data-yk-recs-fallback]');
      if (fresh && fresh.querySelector('.yk-card')) {
        section.innerHTML = fresh.innerHTML;
      } else if (fallback && fallback.content.querySelector('.yk-card')) {
        section.replaceChildren(fallback.content.cloneNode(true));
      } else {
        section.hidden = true;
        return;
      }
      section.setAttribute('data-yk-offers', '');
      if (typeof initYkOffers === 'function') initYkOffers(section);
    })
    .catch(() => { section.hidden = true; });
}

document.querySelectorAll('[data-yk-details]').forEach(initYkDetails);
document.querySelectorAll('[data-yk-recs]').forEach(initYkRecs);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-details]').forEach(initYkDetails);
  event.target.querySelectorAll('[data-yk-recs]').forEach(initYkRecs);
});

// Reviews: our sort menu and write button drive the matching controls inside the Judge.me widget
function initYkPdpReviews(section) {
  if (!section || section.dataset.ready) return;
  section.dataset.ready = 'true';

  const sortWrap = section.querySelector('[data-yk-reviews-sort-wrap]');
  const sort = section.querySelector('[data-yk-reviews-sort]');
  const write = section.querySelector('[data-yk-reviews-write]');
  const widget = section.querySelector('.jdgm-widget');
  if (!widget) return;

  const findWrite = () => Array.from(widget.querySelectorAll('button, a')).find((el) => /write/i.test(`${el.className} ${el.textContent}`));

  const connect = () => {
    const source = widget.querySelector('.jm-sort-filter__select, .jdgm-sort-dropdown');
    if (source && sort && !sort.dataset.ready) {
      sort.dataset.ready = 'true';
      Array.from(source.options).forEach((option) => sort.add(new Option(option.textContent.trim(), option.value)));
      sort.addEventListener('change', () => {
        source.value = sort.value;
        source.dispatchEvent(new Event('change', { bubbles: true }));
      });
      sortWrap.hidden = false;
    }
    const writeTarget = findWrite();
    if (write) write.hidden = !writeTarget;
    return Boolean(source);
  };

  if (write) {
    write.addEventListener('click', () => {
      const target = findWrite();
      if (target) target.click();
    });
  }

  if (!connect()) {
    const observer = new MutationObserver(() => {
      if (connect()) observer.disconnect();
    });
    observer.observe(widget, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  }
}

document.querySelectorAll('[data-yk-pdp-reviews]').forEach(initYkPdpReviews);
document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-yk-pdp-reviews]').forEach(initYkPdpReviews);
});

// Tabs media: YouTube/Vimeo player is loaded only when the visitor presses play
document.addEventListener('click', (event) => {
  const play = event.target.closest('[data-yk-embed-play]');
  if (!play) return;
  const box = play.closest('[data-yk-embed]');
  if (!box || box.querySelector('iframe')) return;
  const frame = document.createElement('iframe');
  frame.src = box.dataset.ykEmbed;
  frame.title = box.dataset.ykEmbedTitle || 'Video';
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  frame.allowFullscreen = true;
  box.appendChild(frame);
  play.remove();
});

// "Buy with shop" (design style): open Shop Pay checkout for the selected variant and quantity
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-yk-shop-pay]');
  if (!link) return;
  const buy = link.closest('[data-yk-buy]') || document;
  const variant = buy.querySelector('[data-yk-shop-variant]');
  const qtyInput = buy.querySelector('[data-yk-qty] input[name="quantity"]');
  const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : '1', 10) || 1);
  if (!variant || !variant.value) return;
  event.preventDefault();
  const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  window.location.href = root + 'cart/' + variant.value + ':' + qty + '?payment=shop_pay';
});

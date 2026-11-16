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

  // Swipe with the mouse too (tester 14.11 p.5): drag the photo left or right to change it.
  // Touch screens scroll the track natively.
  let lastPointer = 'mouse';
  let drag = null;
  let suppressClick = false;
  main.addEventListener('pointerdown', (event) => {
    lastPointer = event.pointerType || 'mouse';
    if (lastPointer !== 'mouse' || event.button !== 0 || slides.length < 2) return;
    if (main.classList.contains('is-zoomed') || event.target.closest('button, a, video, iframe, model-viewer')) return;
    drag = { x: event.clientX, left: track.scrollLeft, dx: 0, start: index };
  });
  window.addEventListener('pointermove', (event) => {
    if (!drag) return;
    drag.dx = event.clientX - drag.x;
    if (Math.abs(drag.dx) < 6) return;
    track.style.scrollSnapType = 'none';
    track.style.cursor = 'grabbing';
    track.scrollLeft = drag.left - drag.dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    const { dx, start } = drag;
    drag = null;
    if (Math.abs(dx) < 6) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    track.style.removeProperty('scroll-snap-type');
    track.style.removeProperty('cursor');
    goTo(dx < -40 ? start + 1 : dx > 40 ? start - 1 : start);
  });
  track.addEventListener('dragstart', (event) => event.preventDefault());

  if (zoom) {
    zoom.addEventListener('click', (event) => {
      event.stopPropagation();
      const rect = main.getBoundingClientRect();
      setZoom(true);
      moveZoom({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 });
    });
    main.addEventListener('click', (event) => {
      if (suppressClick) { suppressClick = false; return; }
      // Zoom is for the mouse; a tap on a touch screen must not lock the gallery (tester 14.11 p.5)
      if (lastPointer !== 'mouse') return;
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

// "…or from $X/mo with shop": the Shop logo lives in the shopify-payment-terms shadow DOM (no parts to style);
// a stylesheet adopted into it sets the logo to 46x24 as in the design (tester 14.11 p.2)
(() => {
  let sheet;
  const styleTerms = () => document.querySelectorAll('shopify-payment-terms').forEach((host) => {
    const root = host.shadowRoot;
    if (!root || root.ykStyled) return;
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync('svg[class~="w-[34px]"] { width: 46px; height: 24px; }');
    }
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    root.ykStyled = true;
  });
  styleTerms();
  setInterval(styleTerms, 1000);
})();
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
  const sortButton = section.querySelector('[data-yk-reviews-sort-button]');
  const sortList = section.querySelector('[data-yk-reviews-sort-list]');
  const write = section.querySelector('[data-yk-reviews-write]');
  const widget = section.querySelector('.jdgm-widget');
  if (!widget) return;

  const findWrite = () => Array.from(widget.querySelectorAll('button, a')).find((el) => /write/i.test(`${el.className} ${el.textContent}`) && !el.closest('.jdgm-write-review-modal'));

  // The current Judge.me widget has no write button of its own: open its write-a-review window directly,
  // the same way the widget does it (old widgets still get their own button clicked)
  const openJudgeMe = () => {
    const jdgm = window.jdgm;
    const productId = widget.dataset.id;
    if (!jdgm || !jdgm._WriteReviewModal || !productId) return false;
    document.querySelectorAll('.jdgm-review-widget-modal.jdgm-write-review-modal').forEach((modal) => modal.remove());
    const modal = new jdgm._WriteReviewModal(jdgm.$);
    Promise.resolve(modal.setup('jdgm-review-widget-modal', productId)).then((ready) => {
      if (ready) modal.showModalPage();
    }).catch(() => {});
    return true;
  };

  // Sort menu: a listbox built from the Judge.me sort options (the browser's own select menu can't be styled)
  const setupSort = (source) => {
    const options = Array.from(source.options).map((option, index) => {
      const item = document.createElement('li');
      item.className = 'yk-reviews-pdp__sort-option';
      item.id = `${sortList.id}-${index}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(index === source.selectedIndex));
      item.dataset.value = option.value;
      item.textContent = option.textContent.trim();
      sortList.appendChild(item);
      return item;
    });
    let active = -1;

    const setActive = (index) => {
      options.forEach((item, i) => item.classList.toggle('is-active', i === index));
      active = index;
      if (options[index]) sortList.setAttribute('aria-activedescendant', options[index].id);
    };
    const open = () => {
      sortList.hidden = false;
      sortButton.setAttribute('aria-expanded', 'true');
      const selected = options.findIndex((item) => item.getAttribute('aria-selected') === 'true');
      setActive(selected > -1 ? selected : 0);
      sortList.focus({ preventScroll: true });
    };
    const close = (focusButton) => {
      if (sortList.hidden) return;
      sortList.hidden = true;
      sortButton.setAttribute('aria-expanded', 'false');
      if (focusButton) sortButton.focus({ preventScroll: true });
    };
    const choose = (index) => {
      const item = options[index];
      if (!item) return;
      options.forEach((option) => option.setAttribute('aria-selected', String(option === item)));
      // QA 16.11 p.13: the button shows the chosen order
      const label = sortButton.querySelector('span');
      if (label) label.textContent = item.textContent.trim();
      source.value = item.dataset.value;
      source.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    };

    sortButton.addEventListener('click', () => (sortList.hidden ? open() : close(true)));
    sortList.addEventListener('click', (event) => {
      const item = event.target.closest('[role="option"]');
      if (item) choose(options.indexOf(item));
    });
    sortList.addEventListener('mousemove', (event) => {
      const item = event.target.closest('[role="option"]');
      if (item) setActive(options.indexOf(item));
    });
    sortList.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive(Math.min(active + 1, options.length - 1)); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(Math.max(active - 1, 0)); }
      else if (event.key === 'Home') { event.preventDefault(); setActive(0); }
      else if (event.key === 'End') { event.preventDefault(); setActive(options.length - 1); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active); }
      else if (event.key === 'Escape' || event.key === 'Tab') close(event.key === 'Escape');
    });
    document.addEventListener('click', (event) => {
      if (!sortWrap.contains(event.target)) close(false);
    });
  };

  const connect = () => {
    const source = widget.querySelector('.jm-sort-filter__select, .jdgm-sort-dropdown');
    if (source && sortList && !sortList.dataset.ready) {
      sortList.dataset.ready = 'true';
      setupSort(source);
      sortWrap.hidden = false;
    }
    return Boolean(source);
  };

  // Follow Judge.me's own "who can write a review" setting: with "signed-in customers" it rejects
  // reviews from guests (422 "Web reviews ... are not allowed"), and its own widget hides the button for them
  const canWrite = () => {
    const settings = window.jdgmSettings || {};
    if (settings.disable_web_reviews) return false;
    const visibility = settings.write_review_button_visibility;
    if (!visibility || visibility === 'everyone' || visibility === 'all') return true;
    if (visibility === 'signed_in_customers') return write.hasAttribute('data-yk-signed-in');
    return false;
  };

  if (write && canWrite()) {
    write.hidden = false;
    write.addEventListener('click', () => {
      const target = findWrite();
      if (target) {
        target.click();
        return;
      }
      if (!openJudgeMe()) widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (!connect()) {
    const observer = new MutationObserver(() => {
      if (connect()) observer.disconnect();
    });
    observer.observe(widget, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  }

  // QA 16.11 p.12, p.35: Judge.me's "Verified" mark and its seal (link to judge.me) next to our review count,
  // a "Verified buyer" hint on the red badge of each review, the photo-row arrow only when the photos overflow
  const count = section.querySelector('.yk-reviews-pdp__count, .yk-reviews-pdp__average');
  const decorate = () => {
    if (count) {
      const badge = widget.querySelector('.jm-review-widget__header .jm-verified-badge');
      const medals = widget.querySelector('.jm-review-widget__header .jm-medals');
      let trust = section.querySelector('.yk-reviews-pdp__trust');
      if (!trust && (badge || medals)) {
        trust = document.createElement('div');
        trust.className = 'yk-reviews-pdp__trust';
        count.insertAdjacentElement('afterend', trust);
      }
      // Judge.me draws its seal a little later than the badge, so each is added once it exists
      if (trust && badge && !trust.querySelector('.jm-verified-badge')) trust.prepend(badge.cloneNode(true));
      if (trust && medals && medals.querySelector('a, svg') && !trust.querySelector('.jm-medals')) trust.appendChild(medals.cloneNode(true));
    }
    widget.querySelectorAll('.jm-verified-buyer-badge:not([title])').forEach((el) => {
      el.title = 'Verified buyer';
    });
    widget.querySelectorAll('.jm-media-grid').forEach((grid) => {
      const track = grid.querySelector('.jm-media-grid__container');
      const overflow = track ? track.scrollWidth > track.clientWidth + 2 : false;
      grid.classList.toggle('yk-no-overflow', !overflow);
    });
  };
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    window.setTimeout(() => { queued = false; decorate(); }, 50);
  }).observe(widget, { childList: true, subtree: true });
  window.addEventListener('resize', decorate);
  decorate();

  // QA 16.11 p.14: a page change in the review list brings the list top into view below the sticky header
  widget.addEventListener('click', (event) => {
    if (!event.target.closest('.jm-pagination-controls__button')) return;
    window.setTimeout(() => {
      const top = widget.getBoundingClientRect().top;
      const header = document.querySelector('.header__outer-wrapper, .yk-header, header');
      const offset = (header ? Math.max(0, header.getBoundingClientRect().bottom) : 0) + 16;
      if (top < offset || top > window.innerHeight) {
        window.scrollTo({ top: window.scrollY + top - offset, behavior: 'smooth' });
      }
    }, 350);
  });
}

// Judge.me write-a-review window: a click on the dimmed page around it closes it, like the close button
document.addEventListener('click', (event) => {
  const modal = event.target.closest('.jdgm-write-review-modal');
  if (!modal || event.target.closest('.jdgm-write-review-modal__content')) return;
  const closeButton = modal.querySelector('.jdgm-write-review-modal__close-btn');
  if (closeButton) closeButton.click();
});

// Judge.me write-a-review window, QA 16.11 p.21–30: design texts, a 0/1000 counter, the main button
// inactive until the step is filled, Skip on the photo step. Judge.me's steps, checks and sending stay its own.
(() => {
  const MAX = 1000;
  if (window.jdgmSettings) window.jdgmSettings.advanced_settings_next_step_button_text = 'Continue';

  const setLabel = (input, text) => {
    const label = input && input.closest('.jdgm-write-review-modal__field-group')?.querySelector('.jdgm-write-review-modal__field-label');
    if (label && label.textContent !== text) label.textContent = text;
  };

  const enhance = (modal) => {
    if (window.jdgmSettings) window.jdgmSettings.advanced_settings_next_step_button_text = 'Continue';
    const body = modal.querySelector('textarea[name="review_body"]');
    if (body && !body.dataset.ykReady) {
      body.dataset.ykReady = 'true';
      body.maxLength = MAX;
      body.placeholder = 'Write your text';
      setLabel(body, 'Tell us what you liked (required)');
      const counter = document.createElement('p');
      counter.className = 'yk-jm-counter';
      counter.setAttribute('aria-live', 'polite');
      const count = () => { counter.textContent = `${body.value.length}/${MAX} symbols`; };
      body.insertAdjacentElement('afterend', counter);
      body.addEventListener('input', count);
      count();
    }
    const name = modal.querySelector('input[name="reviewer_name"]');
    const email = modal.querySelector('input[name="reviewer_email"]');
    if (name && !name.dataset.ykReady) {
      name.dataset.ykReady = 'true';
      name.placeholder = 'Your name';
      setLabel(name, 'Your name (required)');
    }
    if (email && !email.dataset.ykReady) {
      email.dataset.ykReady = 'true';
      email.placeholder = 'Your email';
      setLabel(email, 'Your email (required)');
    }
    // Photo step: the hint goes under the upload field, as in the design
    const mediaPage = modal.querySelector('.jdgm-write-review-modal__page--share-media');
    const hint = mediaPage?.querySelector('.jdgm-write-review-modal__page-header .jdgm-write-review-modal__intro');
    const upload = mediaPage?.querySelector('.jdgm-write-review-modal__field-group--media-upload');
    if (hint && upload) {
      hint.classList.add('yk-jm-media-hint');
      upload.insertAdjacentElement('afterend', hint);
    }
    // Skip on the photo step (the photo is optional)
    const nav = modal.querySelector('.jdgm-write-review-modal__navigation');
    const next = modal.querySelector('.jdgm-write-review-modal__nav-btn-next');
    if (nav && next && !nav.querySelector('.yk-jm-skip')) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'jdgm-write-review-modal__nav-btn yk-jm-skip';
      skip.textContent = 'Skip';
      skip.addEventListener('click', () => {
        next.classList.remove('yk-jm-incomplete');
        next.click();
      });
      next.insertAdjacentElement('beforebegin', skip);
    }
    update(modal);
  };

  // The main button looks inactive until the required fields of the current step are filled (or a photo is added)
  const update = (modal) => {
    const page = modal.querySelector('.jdgm-write-review-modal__page.current-page');
    const next = modal.querySelector('.jdgm-write-review-modal__nav-btn-next');
    if (!page || !next) return;
    const isMedia = page.classList.contains('jdgm-write-review-modal__page--share-media');
    modal.classList.toggle('yk-jm-on-media', isMedia);
    let incomplete = false;
    if (isMedia) {
      incomplete = !page.querySelector('.jdgm-write-review-modal__media-preview-container');
    } else {
      incomplete = Array.from(page.querySelectorAll('textarea[name="review_body"], input[name="reviewer_name"], input[name="reviewer_email"]'))
        .some((field) => !field.disabled && !field.value.trim());
    }
    next.classList.toggle('yk-jm-incomplete', incomplete);
    next.setAttribute('aria-disabled', String(incomplete));
  };

  const observer = new MutationObserver(() => {
    document.querySelectorAll('.jdgm-write-review-modal').forEach(enhance);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('input', (event) => {
    const modal = event.target.closest && event.target.closest('.jdgm-write-review-modal');
    if (modal) update(modal);
  });
  // An inactive main button does nothing (the design shows it greyed out until the step is filled)
  document.addEventListener('click', (event) => {
    const next = event.target.closest && event.target.closest('.jdgm-write-review-modal__nav-btn-next.yk-jm-incomplete');
    if (!next) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();

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
  const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  // QA 16.11 p.19: checkout opens in a new tab, the product page stays open. The link itself (target="_blank")
  // is followed by the browser; here it only gets the current variant and quantity.
  link.href = root + 'cart/' + variant.value + ':' + qty + '?payment=shop_pay';
});

// Sticky Add to cart bar (design "Page Scrolling"): shown once the buy buttons are above the screen
document.querySelectorAll('[data-yk-sticky-buy]').forEach((bar) => {
  const section = bar.closest('section') || document;
  const buy = section.querySelector('[data-yk-buy]');
  const add = section.querySelector('[data-yk-add]');
  if (!buy || !add) return;
  const button = bar.querySelector('[data-yk-sticky-add]');
  const price = bar.querySelector('[data-yk-sticky-price]');
  const variantText = bar.querySelector('[data-yk-sticky-variant]');
  const mainPrice = section.querySelector('[data-yk-price]');
  const picker = section.querySelector('[data-yk-variant-picker]');
  button.textContent = add.textContent.trim() || button.textContent;

  const sync = () => {
    if (mainPrice) {
      const copy = mainPrice.cloneNode(true);
      copy.querySelectorAll('s').forEach((el) => el.remove());
      price.textContent = copy.textContent.trim();
    }
    if (picker && variantText) {
      const values = Array.from(picker.querySelectorAll('fieldset')).map((fieldset) => fieldset.querySelector('input:checked')?.value).filter(Boolean);
      if (values.length) variantText.textContent = values.join(' / ');
    }
    const available = add.closest('[data-yk-buy-available]');
    button.disabled = Boolean(available && available.hidden);
  };
  if (picker) picker.addEventListener('change', () => window.setTimeout(sync, 0));

  let shown = false;
  const show = (on) => {
    if (on === shown) return;
    shown = on;
    if (on) sync();
    bar.classList.toggle('is-visible', on);
    bar.toggleAttribute('inert', !on);
    bar.setAttribute('aria-hidden', String(!on));
    document.body.classList.toggle('yk-sticky-buy-on', on);
  };
  const footer = document.querySelector('.footer, footer, [data-section-type="footer"]');
  const update = () => {
    const passed = buy.getBoundingClientRect().bottom < 0;
    const atFooter = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
    show(passed && !atFooter);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  button.addEventListener('click', () => {
    if (button.disabled) return;
    add.click();
  });
});

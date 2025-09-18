/* =========================================================
   경상동동 통합 스크립트 (app.js)
   - 라이브러리: jQuery, Swiper, Slick, AOS (defer 로드 전제)
   - 각 블록은 IIFE로 스코프 분리
========================================================= */

/* ---------------- AOS ---------------- */
(function () {
  AOS.init({
    duration: 800,
    easing: 'ease-out',
    offset: 80,
    once: false,
    anchorPlacement: 'top-bottom'
  });
})();

/* -------- Back-to-Top (위로 스크롤할 때만 표시) -------- */
(function () {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const SHOW_AT = 200;
  const DIR_THRESHOLD = 6;
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;
    const dy = y - lastY;
    const down = dy > DIR_THRESHOLD;
    const up = dy < -DIR_THRESHOLD;

    if (y <= SHOW_AT) {
      btn.classList.remove('show');
    } else if (up) {
      btn.classList.add('show');      // 위로 올릴 때만 보이기
    } else if (down) {
      btn.classList.remove('show');   // 아래로 내리면 숨김
    }
    lastY = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ---- Sticky GNB with Hover Edge (즉시 접힘) ---- */
(function () {
  const gnb  = document.getElementById('gnb');
  const edge = document.getElementById('hover-edge');
  const mega = document.getElementById('mega');
  if (!gnb || !edge) return;

  const SHOW_STICKY_AT = 80;   // 이 높이 이하에서는 항상 보이기
  const HIDE_AFTER     = 280;  // ↓ 이 높이 넘어서야 아래로 스크롤할 때 숨김 (원하는 만큼 키워)
  const DIR_EPS        = 10;    // 방향 감지 민감도(살짝 둔감하게)

  let lastY = window.scrollY;
  let openLock = false;

  function applyState({ forceOpen = null } = {}) {
    if (forceOpen === true) {
      gnb.classList.add('gnb--open');
      gnb.classList.remove('gnb--hidden');
      return;
    }
    if (forceOpen === false) {
      gnb.classList.remove('gnb--open');
      gnb.classList.add('gnb--hidden');
      return;
    }

    const y  = window.scrollY;
    const dy = y - lastY;
    const down = dy > DIR_EPS;
    const up   = dy < -DIR_EPS;

    // 맨 위 근처이거나 잠금 중이면 항상 보이기
    if (openLock || y <= SHOW_STICKY_AT) {
      gnb.classList.add('gnb--open');
      gnb.classList.remove('gnb--hidden');
      return;
    }

    // 아래로 스크롤: 충분히(=HIDE_AFTER 넘겼을 때만) 숨김
    if (down && y > HIDE_AFTER) {
      gnb.classList.remove('gnb--open');
      gnb.classList.add('gnb--hidden');
      return;
    }

    // 위로 스크롤: 즉시 보이기 (y 값과 상관없이)
    if (up) {
      gnb.classList.add('gnb--open');
      gnb.classList.remove('gnb--hidden');
      return;
    }
  }

  function onScroll() {
    applyState();
    lastY = window.scrollY;
  }

  function lockOpen() {
    openLock = true;
    applyState({ forceOpen: true });
  }

  function unlockOpen() {
    openLock = false;
    // 잠금 해제 시: 이미 HIDE_AFTER 넘었고 마우스가 떠났다면 접어줌
    if (window.scrollY > HIDE_AFTER) {
      applyState({ forceOpen: false });
    } else {
      applyState();
    }
  }

  [edge, gnb, mega].forEach(el => {
    if (!el) return;
    el.addEventListener('mouseenter', lockOpen);
    el.addEventListener('mouseleave', unlockOpen);
  });
  window.addEventListener('scroll', onScroll, { passive: true });

  applyState();
})();


/* ---------------- Swiper: 메인 배너(세로) ---------------- */
(function () {
  const el = document.querySelector('.mySwiper');
  if (!el) return;
  new Swiper(el, {
    direction: 'vertical',
    speed: 1200,
    pagination: { el: '.swiper-pagination', clickable: true },
    autoplay: { delay: 3000, disableOnInteraction: false },
    loop: true
  });
})();

/* -------- Swiper: 이달의 픽(병 슬라이드) + 텍스트 동기화 -------- */
(function () {
  const root = document.querySelector('#slide.swiper-container');
  if (!root) return;

  const pickSwiper = new Swiper(root, {
    slidesPerView: 5,
    spaceBetween: 0,
    centeredSlides: true,
    loop: true,
    observer: true,
    observeParents: true,
    watchSlidesProgress: true,
    pagination: {
      el: '#slide .swiper-pagination',
      clickable: true,
      renderBullet: (index, className) =>
        `<span class="${className}"><span class="bullet__fill"></span></span>`
    },
    navigation: {
      nextEl: '#slide .swiper-button-next',
      prevEl: '#slide .swiper-button-prev'
    }
  });

  // bullet 방향/상태 동기화 (루프/점프 대응)
  function syncBulletAnim(sw) {
    const bullets = document.querySelectorAll('#slide .swiper-pagination .swiper-pagination-bullet');
    if (!bullets.length) return;

    const n = bullets.length;
    const prev = sw.previousRealIndex ?? 0;
    const curr = sw.realIndex ?? 0;
    const d = (curr - prev + n) % n;
    const isForward = d !== 0 && d <= n / 2;

    const pag = document.querySelector('#slide .swiper-pagination');
    if (pag) {
      pag.classList.toggle('dir-forward', isForward);
      pag.classList.toggle('dir-backward', !isForward);
    }

    bullets.forEach(b => b.classList.remove('is-in', 'is-out'));
    if (bullets[prev] && prev !== curr) bullets[prev].classList.add('is-out');
    if (bullets[curr]) bullets[curr].classList.add('is-in');
  }

  pickSwiper.on('init', () => syncBulletAnim(pickSwiper));
  pickSwiper.on('slideChangeTransitionStart', () => syncBulletAnim(pickSwiper));
  syncBulletAnim(pickSwiper);

  // 양옆 강조 표시(prev2/next2)
  function markEdgeSlides() {
    const slides = pickSwiper.slides;
    const total = slides.length;
    slides.forEach(el => el.classList.remove('prev2', 'next2'));
    const prev2 = (pickSwiper.activeIndex - 2 + total) % total;
    const next2 = (pickSwiper.activeIndex + 2) % total;
    slides[prev2]?.classList.add('prev2');
    slides[next2]?.classList.add('next2');
  }
  markEdgeSlides();
  pickSwiper.on('slideChangeTransitionStart', markEdgeSlides);

  // 왼쪽 텍스트 더블버퍼 크로스페이드
  const textWrap = document.querySelector('.mp__text');
  const activeArticle = textWrap?.querySelector('.mp__text-item.active');
  const poolHidden = textWrap ? Array.from(textWrap.querySelectorAll('.hidden .mp__text-item')) : [];

  if (textWrap && activeArticle) {
    const firstVisible = activeArticle.cloneNode(true);
    const items = [firstVisible, ...poolHidden];

    const stage = document.createElement('div');
    stage.className = 'mp__stage';

    const parts = [
      activeArticle.querySelector('h3'),
      activeArticle.querySelector('p'),
      activeArticle.querySelector('.mp__hashtag'),
      activeArticle.querySelector('.mp__text-thumb')
    ].filter(Boolean);

    const layerA = document.createElement('div');
    layerA.className = 'mp__layer is-show';
    parts.forEach(el => layerA.appendChild(el));

    const layerB = document.createElement('div');
    layerB.className = 'mp__layer';

    stage.appendChild(layerA);
    stage.appendChild(layerB);
    activeArticle.appendChild(stage);

    function fillLayer(layer, srcItem) {
      layer.innerHTML = '';
      const h3 = srcItem.querySelector('h3')?.cloneNode(true);
      const p = srcItem.querySelector('p')?.cloneNode(true);
      const ul = srcItem.querySelector('.mp__hashtag')?.cloneNode(true);
      const th = srcItem.querySelector('.mp__text-thumb')?.cloneNode(true);
      [h3, p, ul, th].forEach(node => node && layer.appendChild(node));
    }

    let front = layerA;
    let back = layerB;
    let lastIndex = -1;

    function crossfadeTo(idx) {
      const src = items[idx % items.length];
      fillLayer(back, src);

      stage.style.minHeight = front.offsetHeight + 'px';
      requestAnimationFrame(() => {
        back.classList.add('is-show');
        requestAnimationFrame(() => {
          front.classList.remove('is-show');
          const tmp = front; front = back; back = tmp;
          requestAnimationFrame(() => { stage.style.minHeight = ''; });
        });
      });
    }

    function onSlideStartSync() {
      const i = pickSwiper.realIndex;
      if (i === lastIndex) return;
      lastIndex = i;
      crossfadeTo(i);
    }

    onSlideStartSync();
    pickSwiper.on('slideChangeTransitionStart', onSlideStartSync);
    pickSwiper.on('realIndexChange', onSlideStartSync);
  }
})();

/* -------------- 양조장 지도: Slick + 핀 이동 -------------- */
(function () {
  if (!window.jQuery) return;
  const $ = window.jQuery;

  const $slider = $('.center');
  const $dots = $('.bm__map .pin');
  const $bigPin = $('#pin-focus');
  if (!$slider.length || !$dots.length || !$bigPin.length) return;

  $slider.slick({ arrows: true, dots: false, infinite: true });
  moveTo(0);

  $slider.on('beforeChange', (e, slick, curr, next) => moveTo(next));

  $dots.on('click', function () {
    const idx = $(this).data('slide');
    $slider.slick('slickGoTo', idx);
    moveTo(idx);
  });

  function moveTo(i) {
    $dots.removeClass('current').filter(`[data-slide=${i}]`).addClass('current');
    const $t = $dots.filter(`[data-slide=${i}]`);
    $bigPin.css({
      left: parseInt($t.css('left'), 10) + 8.5,
      top: parseInt($t.css('top'), 10)
    });
  }
})();

/* ------------------- 탭 전환 ------------------- */
(function () {
  if (!window.jQuery) return;
  const $ = window.jQuery;

  $('.tab-nav li').on('click', function () {
    const id = $(this).data('tab');
    $(this).addClass('on').siblings().removeClass('on');
    $('.tab-panel').removeClass('show');
    $('#' + id).addClass('show');
  });
})();

/* ------------- 한 잔의 기록: 카드 호버 확장 ------------- */
(function () {
  const cards = document.querySelectorAll('.story-card');
  if (!cards.length) return;
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      cards.forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
    });
  });
})();

/* ----------------- 테스트 섹션: 배경 버블 ----------------- */
(function () {
  const section = document.getElementById('test');
  if (!section) return;

  Math.TWO_PI = Math.PI * 2;
  let canvas, ctx, bubbles = [];

  function Bubble(opts = {}) { this.init(opts); }
  Bubble.prototype = {
    init(opts = {}) {
      this.radius = Math.random() * 7;
      this.x = opts.x || Math.random() * canvas.width;
      this.y = opts.y || section.offsetHeight + this.radius;
      this.vx = Math.random() * 0.03;
      this.vy = 1 + Math.random() * 4;
      this.sway = 0.25 + Math.random() * 0.25;
      this.angle = Math.random() * Math.TWO_PI;
      this.opacity = 0.2 + Math.random() * 0.2;
      return this;
    },
    update() {
      this.x += Math.cos(this.angle) * this.sway;
      this.y -= this.vy;
      this.angle += this.vx;
      if (this.y + this.radius < 0) this.init({ y: section.offsetHeight + this.radius });
    },
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.TWO_PI);
      ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
      ctx.fill();
    },
    render() { this.update(); this.draw(); }
  };

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bubbles.forEach(b => b.render());
    requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width = section.clientWidth;
    canvas.height = section.clientHeight;
  }

  (function init() {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%;';
    section.style.position = 'relative';
    section.appendChild(canvas);

    ctx = canvas.getContext('2d');
    resize();

    const num = Math.round(canvas.width * 0.125);
    bubbles = [];
    for (let i = 0; i < num; i++) {
      bubbles.push(new Bubble({ x: Math.random() * canvas.width, y: Math.random() * canvas.height }));
    }

    window.addEventListener('resize', resize);
    requestAnimationFrame(loop);
  })();
})();

/* ------------------- FAQ 아코디언 ------------------- */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.faq__item');
    if (!items.length) return;

    items.forEach(item => {
      const btn = item.querySelector('.faq__q');
      const answer = item.querySelector('.faq__a');
      if (!btn || !answer) return;

      answer.style.height = '0';
      answer.hidden = true;

      answer.addEventListener('transitionend', () => {
        if (!item.classList.contains('open')) {
          answer.style.height = '0';
          answer.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
        } else {
          answer.style.height = 'auto';
          answer.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
        }
      });

      btn.addEventListener('click', () => {
        const opened = document.querySelector('.faq__item.open');
        if (opened && opened !== item) close(opened);
        item.classList.contains('open') ? close(item) : open(item);
      });

      function open(it) {
        const a = it.querySelector('.faq__a');
        a.hidden = false;
        a.style.height = 'auto';
        const full = a.scrollHeight + 'px';
        a.style.height = '0';
        requestAnimationFrame(() => {
          it.classList.add('open');
          a.style.height = full;
        });
      }

      function close(it) {
        const a = it.querySelector('.faq__a');
        a.style.height = a.scrollHeight + 'px';
        requestAnimationFrame(() => {
          it.classList.remove('open');
          a.style.height = '0';
        });
      }
    });
  });
})();

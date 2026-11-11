(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const intro = $("#intro");
  const body = document.body;

  // Intro reveal: a full-frame identity card opens into the portfolio.
  const closeIntro = () => {
    intro?.classList.add("is-out");
    body.classList.remove("is-loading");
  };
  body.classList.add("is-loading");
  window.addEventListener("load", () => {
    window.setTimeout(closeIntro, 1550);
  });
  $("#skipIntro")?.addEventListener("click", closeIntro);

  // Top progress and sticky header.
  const progressBar = $("#progressBar");
  const header = $(".site-header");
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    if (progressBar) progressBar.style.width = `${ratio * 100}%`;
    if (header) header.classList.toggle("is-sticky", window.scrollY > 50);
  };
  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  // Responsive menu.
  const menuToggle = $("#menuToggle");
  const nav = $(".main-nav");
  menuToggle?.addEventListener("click", () => {
    const open = menuToggle.classList.toggle("is-open");
    nav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  $$(".main-nav a").forEach(a => a.addEventListener("click", () => {
    menuToggle?.classList.remove("is-open");
    nav?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }));

  // Scroll reveal.
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  $$(".reveal").forEach(el => revealObserver.observe(el));
  const approachRail = $(".approach__rail");
  if (approachRail) {
    const railObserver = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("is-visible"); });
    }, { threshold: .25 });
    railObserver.observe(approachRail);
  }

  // Cursor follows the pointer; interactive cards turn it into a VIEW cue.
  const dot = $(".cursor-dot"), label = $(".cursor-label");
  if (window.matchMedia("(pointer:fine)").matches) {
    body.classList.add("cursor-ready");
    let mx = 0, my = 0, dx = 0, dy = 0;
    window.addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; });
    const animateCursor = () => {
      dx += (mx - dx) * .2; dy += (my - dy) * .2;
      if (dot) dot.style.left = `${dx}px`, dot.style.top = `${dy}px`;
      if (label) label.style.left = `${dx}px`, label.style.top = `${dy}px`;
      requestAnimationFrame(animateCursor);
    };
    animateCursor();
    document.addEventListener("pointerover", e => {
      const target = e.target.closest("[data-cursor]");
      body.classList.toggle("cursor-hover", !!target);
      if (target && label) label.textContent = target.dataset.cursor || "VIEW";
    });
  }

  // Magnetic buttons.
  if (window.matchMedia("(pointer:fine)").matches) {
    $$(".magnetic").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .12;
        const y = (e.clientY - r.top - r.height / 2) * .12;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  // Render project cards from the portfolio source.
  const projects = window.PORTFOLIO_PROJECTS || [];
  const grid = $("#projectGrid");
  const count = $("#filterCount");
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const renderProjects = filter => {
    if (!grid) return;
    const shown = projects.filter(p => filter === "all" || p.category === filter);
    grid.innerHTML = shown.map((p, i) => `
      <article class="project-card reveal" data-project-id="${escapeHTML(p.id)}" data-cursor="VIEW">
        <div class="project-card__visual" style="--tint:${escapeHTML(p.tint)}">
          <span class="project-card__index">${escapeHTML(p.index)} / 20</span>
          <img class="project-card__image" src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}" loading="lazy">
          <span class="project-card__arrow">↗</span>
        </div>
        <div class="project-card__meta">
          <div>
            <span class="project-card__category">${escapeHTML(p.categoryLabel)}</span>
            <h3 class="project-card__title">${escapeHTML(p.title)}</h3>
            <span class="project-card__subtitle">${escapeHTML(p.subtitle)}</span>
          </div>
          <span class="project-card__num">${String(i + 1).padStart(2,"0")}</span>
        </div>
      </article>
    `).join("");
    if (count) count.textContent = `${shown.length} PROJECT${shown.length === 1 ? "" : "S"}`;
    $$(".project-card", grid).forEach(el => {
      revealObserver.observe(el);
      el.addEventListener("click", () => openProject(el.dataset.projectId));
    });
  };
  renderProjects("all");

  $$(".filter-chip").forEach(btn => btn.addEventListener("click", () => {
    $$(".filter-chip").forEach(b => b.classList.toggle("is-active", b === btn));
    renderProjects(btn.dataset.filter);
  }));

  // Project details modal.
  const modal = $("#projectModal");
  const modalContent = $("#modalContent");
  const closeModal = () => {
    modal?.classList.remove("is-open");
    modal?.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-open");
  };
  const openProject = id => {
    const p = projects.find(item => item.id === id);
    if (!p || !modal || !modalContent) return;
    const gallery = (p.gallery || [p.image]).map((src, i) => `
      <figure><img src="${escapeHTML(src)}" alt="${escapeHTML(p.title)} — image ${i+1}" loading="lazy"></figure>
    `).join("");
    const detail = (label, value) => value ? `
      <article><span>${label}</span><p>${escapeHTML(value)}</p></article>` : "";
    modalContent.innerHTML = `
      <p class="modal__eyebrow">${escapeHTML(p.index)} / ${escapeHTML(p.categoryLabel)}</p>
      <h2 class="modal__title" id="modalTitle">${escapeHTML(p.title)}</h2>
      <p class="modal__subtitle">${escapeHTML(p.subtitle)}</p>
      <div class="modal__hero" style="--modal-tint:${escapeHTML(p.tint)}">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}">
      </div>
      ${p.gallery && p.gallery.length > 1 ? `<div class="modal__gallery">${gallery}</div>` : ""}
      <div class="modal__details">
        ${detail("DESIGN APPROACH", p.intro)}
        ${detail("POSITIONING", p.positioning)}
        ${detail("COLOR PALETTE", p.color)}
        ${detail("MATERIAL & STRUCTURE", p.material)}
      </div>
      ${p.quote ? `<p class="modal__quote">「${escapeHTML(p.quote)}」</p>` : ""}
    `;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
    $("#modalClose")?.focus();
  };
  $("#modalClose")?.addEventListener("click", closeModal);
  $$(".modal__backdrop,[data-close-modal]").forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
  $$("[data-modal-project]").forEach(el => el.addEventListener("click", () => openProject(el.dataset.modalProject)));

  // Horizontal collection rail: buttons + drag gesture.
  const track = $("#collectionTrack");
  $("#collectionPrev")?.addEventListener("click", () => track?.scrollBy({ left: -track.clientWidth * .72, behavior: "smooth" }));
  $("#collectionNext")?.addEventListener("click", () => track?.scrollBy({ left: track.clientWidth * .72, behavior: "smooth" }));
  if (track) {
    let down = false, startX = 0, startScroll = 0;
    track.addEventListener("pointerdown", e => {
      if (e.pointerType === "touch") return;
      down = true; startX = e.clientX; startScroll = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", e => {
      if (!down) return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    });
    ["pointerup","pointercancel","lostpointercapture"].forEach(type => track.addEventListener(type, () => down = false));
  }

  // Tiny scroll-based parallax on selected visuals, disabled on mobile / reduced motion.
  if (window.matchMedia("(min-width: 701px) and (prefers-reduced-motion: no-preference)").matches) {
    const parallaxItems = [".hero__box-art", ".contact__orb"];
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      const art = $(".hero__box-art");
      if (art && y < window.innerHeight * 1.2) art.style.translate = `0 ${y * .045}px`;
      const orb = $(".contact__orb");
      if (orb) orb.style.transform = `translateY(${Math.max(-40, Math.min(40, (y - document.body.scrollHeight + window.innerHeight) * -.035))}px)`;
    }, { passive: true });
  }
})();

(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Page loader ---- */
  var loader = document.getElementById("pageLoader");
  function hideLoader() {
    if (!loader) return;
    loader.classList.add("is-hidden");
    setTimeout(function () { loader.remove(); }, 600);
  }
  window.addEventListener("load", function () { setTimeout(hideLoader, 250); });
  setTimeout(hideLoader, 2000); // safety fallback

  /* ---- Hero particles ---- */
  var particleWrap = document.getElementById("heroParticles");
  if (particleWrap && !reduceMotion) {
    var count = window.innerWidth < 700 ? 8 : 16;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("span");
      var left = Math.random() * 100;
      var duration = 10 + Math.random() * 10;
      var delay = Math.random() * -20;
      var drift = (Math.random() * 80 - 40).toFixed(0) + "px";
      var size = (3 + Math.random() * 4).toFixed(1) + "px";
      p.style.left = left + "%";
      p.style.width = size;
      p.style.height = size;
      p.style.animationDuration = duration + "s";
      p.style.animationDelay = delay + "s";
      p.style.setProperty("--drift", drift);
      particleWrap.appendChild(p);
    }
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach(function (el) { revealObserver.observe(el); });

  /* ---- Header: hide on scroll down, show on scroll up ---- */
  var header = document.getElementById("siteHeader");
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      header.classList.toggle("scrolled", y > 8);
      var navOpen = nav && nav.classList.contains("active");
      if (!navOpen && y > lastY && y > 120) header.classList.add("header-hidden");
      else if (!navOpen) header.classList.remove("header-hidden");
      lastY = y;
      ticking = false;

      var backBtn = document.getElementById("backToTop");
      if (backBtn) backBtn.classList.toggle("visible", y > 600);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile burger menu ---- */
  var burger = document.getElementById("burgerBtn");
  var nav = document.getElementById("mainNav");
  if (burger && nav) {
    burger.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("active");
      document.body.style.overflow = open ? "" : "hidden";
      if (!open) header.classList.remove("header-hidden");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("active");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("active") && !nav.contains(e.target) && !burger.contains(e.target)) {
        nav.classList.remove("active");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 980 && nav.classList.contains("active")) {
        nav.classList.remove("active");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }

  /* ---- Scrollspy: highlight active nav link ---- */
  var sections = ["top", "kurslar", "filiallar", "natijalar", "aloqa"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navLinks = document.querySelectorAll(".nav-link");
  var spyObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + id);
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach(function (s) { spyObserver.observe(s); });

  /* ---- Count-up stats ---- */
  var statNums = document.querySelectorAll(".stat-num");
  var statObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10) || 0;
        var suffix = el.getAttribute("data-suffix") || "";
        var start = 0;
        var duration = 1200;
        var startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var value = Math.round(start + (target - start) * eased);
          el.textContent = value + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        statObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  statNums.forEach(function (el) { statObserver.observe(el); });

  /* ---- Hero parallax on mouse move (desktop only) ---- */
  var heroArt = document.getElementById("heroArt");
  var heroShield = document.getElementById("heroShield");
  if (heroArt && heroShield && !reduceMotion && window.matchMedia("(min-width: 981px)").matches) {
    // Parallax is applied to the container (not the shield itself), since the
    // shield already has its own CSS `float` animation on `transform` and a
    // CSS animation always wins the cascade over an inline transform.
    heroArt.addEventListener("mousemove", function (e) {
      var rect = heroArt.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width - 0.5;
      var relY = (e.clientY - rect.top) / rect.height - 0.5;
      heroArt.style.transform = "translate(" + (relX * 16).toFixed(1) + "px," + (relY * 16).toFixed(1) + "px)";
    });
    heroArt.addEventListener("mouseleave", function () {
      heroArt.style.transform = "";
    });
  }

  /* ---- Back to top ---- */
  var backBtn = document.getElementById("backToTop");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();

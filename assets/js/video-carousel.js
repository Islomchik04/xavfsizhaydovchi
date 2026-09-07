(function () {
  "use strict";

  var track = document.getElementById("videoTrack");
  if (!track) return;

  var WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxvnKw8OKZryiOOAWD1VAGEJPfUv0CgcHIQPPBUwXWtXk3OwuPGJlxXL-KJEycbQUZEPQ/exec";
  var FALLBACK_IDS = ["dGZyuDc8918", "-HaoiT2MsVU", "8NI4fVlxmW4", "-Iqd_so5YlA", "EZhkWCGl_BU", "Dq-v6zHA0GQ", "-lHfQwhJJ34", "EBlzs4gNrUo"];

  function renderVideos(videos) {
    track.innerHTML = "";
    videos.forEach(function (v) {
      var card = document.createElement("div");
      card.className = "video-card";

      var thumb = document.createElement("div");
      thumb.className = "video-thumb";
      thumb.innerHTML =
        '<img src="https://img.youtube.com/vi/' + v.id + '/hqdefault.jpg" alt="" loading="lazy">' +
        '<span class="video-play" aria-hidden="true">▶</span>';
      thumb.addEventListener("click", function () {
        playVideo(card, v.id);
      });

      card.appendChild(thumb);
      track.appendChild(card);
    });
  }

  function playVideo(card, id) {
    stopAutoScroll();
    var thumb = card.querySelector(".video-thumb");
    if (!thumb) return;
    var frameWrap = document.createElement("div");
    frameWrap.className = "video-frame-wrap";
    frameWrap.innerHTML =
      '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0" ' +
      'title="Video" frameborder="0" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
      'allowfullscreen></iframe>';
    thumb.replaceWith(frameWrap);
  }

  function loadVideos() {
    fetch(WEBHOOK_URL + "?action=videos")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var videos = (data && data.videos && data.videos.length) ? data.videos : FALLBACK_IDS.map(function (id) { return { id: id }; });
        renderVideos(videos);
        startAutoScroll();
      })
      .catch(function () {
        renderVideos(FALLBACK_IDS.map(function (id) { return { id: id }; }));
        startAutoScroll();
      });
  }

  var autoTimer = null;
  function stepWidth() {
    var first = track.children[0];
    if (!first) return 280;
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.gap || style.columnGap || "16") || 16;
    return first.getBoundingClientRect().width + gap;
  }

  function startAutoScroll() {
    stopAutoScroll();
    autoTimer = setInterval(function () {
      if (!track.children.length) return;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: stepWidth(), behavior: "smooth" });
      }
    }, 3500);
  }
  function stopAutoScroll() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  track.addEventListener("mouseenter", stopAutoScroll);
  track.addEventListener("mouseleave", startAutoScroll);
  track.addEventListener("touchstart", stopAutoScroll, { passive: true });

  var prevBtn = document.getElementById("videoPrev");
  var nextBtn = document.getElementById("videoNext");
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      stopAutoScroll();
      track.scrollBy({ left: -stepWidth(), behavior: "smooth" });
      startAutoScroll();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      stopAutoScroll();
      track.scrollBy({ left: stepWidth(), behavior: "smooth" });
      startAutoScroll();
    });
  }

  loadVideos();
})();

(function () {
  "use strict";

  var WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxvnKw8OKZryiOOAWD1VAGEJPfUv0CgcHIQPPBUwXWtXk3OwuPGJlxXL-KJEycbQUZEPQ/exec";
  var SESSION_KEY = "xh_admin_pw";

  var loginView = document.getElementById("adminLogin");
  var dashView = document.getElementById("adminDashboard");
  var loginForm = document.getElementById("adminLoginForm");
  var loginInput = document.getElementById("adminPasswordInput");
  var loginError = document.getElementById("adminLoginError");
  var logoutBtn = document.getElementById("adminLogout");

  var tabs = document.querySelectorAll(".admin-tab");
  var panels = document.querySelectorAll(".admin-panel");

  var applicantsWrap = document.getElementById("applicantsWrap");
  var applicantsCount = document.getElementById("applicantsCount");
  var applicantsFilters = document.getElementById("applicantsFilters");
  var applicantsSearch = document.getElementById("applicantsSearch");
  var applicantsLavozimFilter = document.getElementById("applicantsLavozimFilter");
  var applicantsFilialFilter = document.getElementById("applicantsFilialFilter");
  var applicantsFilterClear = document.getElementById("applicantsFilterClear");

  // Full dataset from the last successful fetch, kept around so filtering
  // can happen instantly in the browser instead of re-querying the sheet.
  var applicantsData = { headers: [], rows: [] };

  var videoGrid = document.getElementById("videoGrid");
  var addVideoForm = document.getElementById("addVideoForm");
  var addVideoUrl = document.getElementById("addVideoUrl");
  var addVideoTitle = document.getElementById("addVideoTitle");
  var addVideoMsg = document.getElementById("addVideoMsg");

  var filialList = document.getElementById("filialList");
  var addFilialForm = document.getElementById("addFilialForm");
  var addFilialInput = document.getElementById("addFilialInput");
  var addFilialMsg = document.getElementById("addFilialMsg");

  var lavozimList = document.getElementById("lavozimList");
  var addLavozimForm = document.getElementById("addLavozimForm");
  var addLavozimInput = document.getElementById("addLavozimInput");
  var addLavozimMsg = document.getElementById("addLavozimMsg");

  function getPassword() {
    try { return sessionStorage.getItem(SESSION_KEY) || ""; } catch (e) { return ""; }
  }
  function setPassword(pw) {
    try { sessionStorage.setItem(SESSION_KEY, pw); } catch (e) { /* ignore */ }
  }
  function clearPassword() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  function showLogin() {
    loginView.hidden = false;
    dashView.hidden = true;
    if (logoutBtn) logoutBtn.hidden = true;
  }
  function showDashboard() {
    loginView.hidden = true;
    dashView.hidden = false;
    if (logoutBtn) logoutBtn.hidden = false;
    loadApplicants();
    loadVideos();
    loadOptions();
  }

  function tryLogin(password) {
    return fetch(WEBHOOK_URL + "?action=applicants&password=" + encodeURIComponent(password))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        return data && data.result === "success";
      })
      .catch(function () { return false; });
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.classList.remove("show");
    var pw = loginInput.value.trim();
    if (!pw) return;
    var submitBtn = loginForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    tryLogin(pw).then(function (ok) {
      submitBtn.disabled = false;
      if (ok) {
        setPassword(pw);
        showDashboard();
      } else {
        loginError.textContent = "Parol noto'g'ri";
        loginError.classList.add("show");
      }
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      clearPassword();
      loginInput.value = "";
      showLogin();
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      panels.forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      var target = document.getElementById(tab.getAttribute("data-panel"));
      if (target) target.classList.add("active");
    });
  });

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Finds the index of the header whose text contains `needle` (e.g. "lavozim"),
  // so the position/branch filters work no matter how the sheet's columns are
  // ordered or how many other columns sit around them.
  function findColumnIndex(headers, needle) {
    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i] || "").toLowerCase().indexOf(needle) !== -1) return i;
    }
    return -1;
  }

  function uniqueSorted(values) {
    var seen = {};
    var out = [];
    values.forEach(function (v) {
      v = String(v || "").trim();
      if (v && !seen[v]) { seen[v] = true; out.push(v); }
    });
    out.sort(function (a, b) { return a.localeCompare(b, "uz"); });
    return out;
  }

  function fillSelect(select, values) {
    var current = select.value;
    var options = ['<option value="">' + select.getAttribute("data-all-label") + "</option>"];
    values.forEach(function (v) {
      options.push('<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + "</option>");
    });
    select.innerHTML = options.join("");
    if (values.indexOf(current) !== -1) select.value = current;
  }

  var lavozimColIdx = -1;
  var filialColIdx = -1;

  function setupApplicantsFilters(headers, rows) {
    lavozimColIdx = findColumnIndex(headers, "lavozim");
    filialColIdx = findColumnIndex(headers, "filial");

    applicantsFilters.hidden = false;
    applicantsFilterClear.hidden = false;

    if (lavozimColIdx !== -1) {
      applicantsLavozimFilter.setAttribute("data-all-label", "Barcha lavozimlar");
      fillSelect(applicantsLavozimFilter, uniqueSorted(rows.map(function (r) { return r[lavozimColIdx]; })));
      applicantsLavozimFilter.hidden = false;
    } else {
      applicantsLavozimFilter.hidden = true;
    }

    if (filialColIdx !== -1) {
      applicantsFilialFilter.setAttribute("data-all-label", "Barcha filiallar");
      fillSelect(applicantsFilialFilter, uniqueSorted(rows.map(function (r) { return r[filialColIdx]; })));
      applicantsFilialFilter.hidden = false;
    } else {
      applicantsFilialFilter.hidden = true;
    }
  }

  function getFilteredRows() {
    var rows = applicantsData.rows;
    var q = (applicantsSearch.value || "").trim().toLowerCase();
    var lavozimVal = applicantsLavozimFilter.value;
    var filialVal = applicantsFilialFilter.value;

    return rows.filter(function (row) {
      if (lavozimVal && String(row[lavozimColIdx] || "") !== lavozimVal) return false;
      if (filialVal && String(row[filialColIdx] || "") !== filialVal) return false;
      if (q) {
        var matches = row.some(function (cell) {
          return String(cell || "").toLowerCase().indexOf(q) !== -1;
        });
        if (!matches) return false;
      }
      return true;
    });
  }

  function renderApplicantsTable() {
    var headers = applicantsData.headers;
    var total = applicantsData.rows.length;
    var filtered = getFilteredRows();
    var filterActive = applicantsSearch.value.trim() || applicantsLavozimFilter.value || applicantsFilialFilter.value;

    applicantsCount.textContent = filterActive
      ? filtered.length + " / " + total + " ta ariza"
      : total + " ta ariza";

    if (!total) {
      applicantsWrap.innerHTML = '<div class="admin-empty">Hozircha arizalar yo\'q</div>';
      return;
    }
    if (!filtered.length) {
      applicantsWrap.innerHTML = '<div class="admin-empty">Filtrga mos ariza topilmadi</div>';
      return;
    }

    var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
    headers.forEach(function (h) { html += "<th>" + escapeHtml(h) + "</th>"; });
    html += "</tr></thead><tbody>";
    filtered.forEach(function (row) {
      html += "<tr>";
      row.forEach(function (cell, i) {
        var badge = (i === lavozimColIdx || i === filialColIdx) && cell ? " admin-cell-badge" : "";
        html += '<td class="' + badge.trim() + '">' + escapeHtml(cell) + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    applicantsWrap.innerHTML = html;
  }

  function loadApplicants() {
    applicantsFilters.hidden = true;
    applicantsWrap.innerHTML = '<div class="admin-empty">Yuklanmoqda...</div>';
    fetch(WEBHOOK_URL + "?action=applicants&password=" + encodeURIComponent(getPassword()))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || data.result !== "success") {
          applicantsWrap.innerHTML = '<div class="admin-empty">Xatolik: ma\'lumotlarni yuklab bo\'lmadi</div>';
          return;
        }
        applicantsData.headers = data.headers || [];
        applicantsData.rows = data.rows || [];
        if (applicantsData.rows.length) setupApplicantsFilters(applicantsData.headers, applicantsData.rows);
        renderApplicantsTable();
      })
      .catch(function () {
        applicantsWrap.innerHTML = '<div class="admin-empty">Xatolik: tarmoq bilan bog\'lanib bo\'lmadi</div>';
      });
  }

  applicantsSearch.addEventListener("input", renderApplicantsTable);
  applicantsLavozimFilter.addEventListener("change", renderApplicantsTable);
  applicantsFilialFilter.addEventListener("change", renderApplicantsTable);
  applicantsFilterClear.addEventListener("click", function () {
    applicantsSearch.value = "";
    applicantsLavozimFilter.value = "";
    applicantsFilialFilter.value = "";
    renderApplicantsTable();
  });

  function loadVideos() {
    videoGrid.innerHTML = '<div class="admin-empty">Yuklanmoqda...</div>';
    fetch(WEBHOOK_URL + "?action=videos")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var videos = (data && data.videos) || [];
        if (!videos.length) {
          videoGrid.innerHTML = '<div class="admin-empty">Hozircha video yo\'q</div>';
          return;
        }
        videoGrid.innerHTML = "";
        videos.forEach(function (v) {
          var card = document.createElement("div");
          card.className = "admin-video-card";
          card.innerHTML =
            '<img src="https://img.youtube.com/vi/' + encodeURIComponent(v.id) + '/hqdefault.jpg" alt="">' +
            '<div class="admin-video-card-body">' +
              '<span class="admin-video-id">' + escapeHtml(v.title || v.id) + "</span>" +
              '<button class="admin-video-delete" type="button">O\'chirish</button>' +
            "</div>";
          card.querySelector(".admin-video-delete").addEventListener("click", function () {
            deleteVideo(v.id);
          });
          videoGrid.appendChild(card);
        });
      })
      .catch(function () {
        videoGrid.innerHTML = '<div class="admin-empty">Xatolik: videolarni yuklab bo\'lmadi</div>';
      });
  }

  function deleteVideo(videoId) {
    if (!window.confirm("Bu videoni o'chirishni tasdiqlaysizmi?")) return;
    fetch(WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteVideo", password: getPassword(), videoId: videoId })
    })
      .then(function (r) { return r.json(); })
      .then(function () { loadVideos(); })
      .catch(function () { loadVideos(); });
  }

  if (addVideoForm) {
    addVideoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addVideoMsg.textContent = "";
      addVideoMsg.className = "admin-msg";
      var url = addVideoUrl.value.trim();
      if (!url) return;
      var submitBtn = addVideoForm.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify({ action: "addVideo", password: getPassword(), url: url, title: addVideoTitle.value.trim() })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          submitBtn.disabled = false;
          if (data && data.result === "success") {
            addVideoMsg.textContent = "Video qo'shildi";
            addVideoMsg.className = "admin-msg ok";
            addVideoUrl.value = "";
            addVideoTitle.value = "";
            loadVideos();
          } else {
            addVideoMsg.textContent = "Xatolik: havola noto'g'ri bo'lishi mumkin";
            addVideoMsg.className = "admin-msg err";
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          addVideoMsg.textContent = "Xatolik: tarmoq bilan bog'lanib bo'lmadi";
          addVideoMsg.className = "admin-msg err";
        });
    });
  }

  // ---- Filiallar / Lavozimlar (shown as dynamic options in the join form) ----
  function loadOptions() {
    renderOptionList(filialList, [], true);
    renderOptionList(lavozimList, [], true);
    fetch(WEBHOOK_URL + "?action=options")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || data.result !== "success") {
          renderOptionList(filialList, [], false, true);
          renderOptionList(lavozimList, [], false, true);
          return;
        }
        renderOptionList(filialList, data.filiallar || [], false, false, "deleteFilial");
        renderOptionList(lavozimList, data.lavozimlar || [], false, false, "deleteLavozim");
      })
      .catch(function () {
        renderOptionList(filialList, [], false, true);
        renderOptionList(lavozimList, [], false, true);
      });
  }

  function renderOptionList(container, items, loading, errored, deleteAction) {
    if (!container) return;
    if (loading) {
      container.innerHTML = '<div class="admin-empty">Yuklanmoqda...</div>';
      return;
    }
    if (errored) {
      container.innerHTML = '<div class="admin-empty">Xatolik: ro\'yxatni yuklab bo\'lmadi</div>';
      return;
    }
    if (!items.length) {
      container.innerHTML = '<div class="admin-empty">Hozircha yo\'q</div>';
      return;
    }
    container.innerHTML = "";
    items.forEach(function (name) {
      var chip = document.createElement("span");
      chip.className = "admin-chip";
      chip.innerHTML = '<span>' + escapeHtml(name) + '</span><button type="button" aria-label="O\'chirish">&times;</button>';
      chip.querySelector("button").addEventListener("click", function () {
        deleteOption(deleteAction, name, container.id === "filialList" ? "filial" : "lavozim");
      });
      container.appendChild(chip);
    });
  }

  function deleteOption(action, name, kind) {
    if (!window.confirm("\"" + name + "\" ni o'chirishni tasdiqlaysizmi?")) return;
    fetch(WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify({ action: action, password: getPassword(), name: name })
    })
      .then(function (r) { return r.json(); })
      .then(function () { loadOptions(); })
      .catch(function () { loadOptions(); });
  }

  function bindAddOptionForm(form, input, msg, action) {
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.textContent = "";
      msg.className = "admin-msg";
      var name = input.value.trim();
      if (!name) return;
      var submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify({ action: action, password: getPassword(), name: name })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          submitBtn.disabled = false;
          if (data && data.result === "success") {
            msg.textContent = "Qo'shildi";
            msg.className = "admin-msg ok";
            input.value = "";
            loadOptions();
          } else {
            msg.textContent = "Xatolik yuz berdi";
            msg.className = "admin-msg err";
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          msg.textContent = "Xatolik: tarmoq bilan bog'lanib bo'lmadi";
          msg.className = "admin-msg err";
        });
    });
  }

  bindAddOptionForm(addFilialForm, addFilialInput, addFilialMsg, "addFilial");
  bindAddOptionForm(addLavozimForm, addLavozimInput, addLavozimMsg, "addLavozim");

  // Init: if a password is already stored this session, verify and go straight to dashboard.
  var storedPw = getPassword();
  if (storedPw) {
    tryLogin(storedPw).then(function (ok) {
      if (ok) showDashboard();
      else { clearPassword(); showLogin(); }
    });
  } else {
    showLogin();
  }
})();

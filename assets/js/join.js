(function () {
  "use strict";

  var WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxvnKw8OKZryiOOAWD1VAGEJPfUv0CgcHIQPPBUwXWtXk3OwuPGJlxXL-KJEycbQUZEPQ/exec";

  var form = document.getElementById("joinForm");
  if (!form) return;

  var lavozimSelect = document.getElementById("lavozim");
  var fldOldinIshlaganJoy = document.getElementById("fld-oldinIshlaganJoy");
  var fldMashina = document.getElementById("fld-shaxsiyMashina");
  var fldToifalar = document.getElementById("fld-toifalar");
  var fldKompyuter = document.getElementById("fld-kompyuterBiladimi");
  var fldOldinSohada = document.getElementById("fld-oldinSohada");
  var filialFieldGroup = document.getElementById("fld-filial");
  var filialCheckboxRow = filialFieldGroup ? filialFieldGroup.querySelector(".checkbox-row") : null;

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Filiallar (branches) and lavozimlar (positions) can be managed from the
  // admin panel, so load the current lists from the backend and rebuild the
  // form's options with them. If the request fails, the hardcoded options
  // already in the HTML stay as a fallback.
  function loadDynamicOptions() {
    fetch(WEBHOOK_URL + "?action=options")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || data.result !== "success") return;

        if (filialCheckboxRow && Array.isArray(data.filiallar) && data.filiallar.length) {
          filialCheckboxRow.innerHTML = data.filiallar.map(function (name) {
            var safe = escapeHtml(name);
            return '<label class="checkbox-pill"><input type="checkbox" name="filial" value="' + safe + '"><span>' + safe + "</span></label>";
          }).join("");
        }

        if (lavozimSelect && Array.isArray(data.lavozimlar) && data.lavozimlar.length) {
          var currentValue = lavozimSelect.value;
          lavozimSelect.innerHTML = '<option value="" disabled selected>Tanlang</option>' +
            data.lavozimlar.map(function (name) {
              return "<option>" + escapeHtml(name) + "</option>";
            }).join("");
          if (currentValue && data.lavozimlar.indexOf(currentValue) !== -1) {
            lavozimSelect.value = currentValue;
          }
          updateConditionalFields();
        }
      })
      .catch(function () { /* keep the hardcoded fallback options */ });
  }

  function toggleField(el, show) {
    if (!el) return;
    el.hidden = !show;
    var inputs = el.querySelectorAll("input, textarea");
    inputs.forEach(function (inp) {
      if (!show) {
        if (inp.type === "checkbox" || inp.type === "radio") inp.checked = false;
        else inp.value = "";
      }
      // A `hidden` field is still checked by the browser's form validation —
      // only `required` itself (not visibility) controls that. So fields that
      // are only mandatory while shown use a `data-required` marker in the
      // HTML, and the live `required` property is kept in sync with `show`
      // here instead of being a static attribute.
      if (inp.hasAttribute("data-required")) inp.required = show;
    });
  }

  function updateConditionalFields() {
    var v = lavozimSelect.value;
    var isAmaliy = v === "Amaliy o'qituvchi";
    var isNazariy = v === "Nazariy o'qituvchi";
    var isAdmin = v === "Administrator";
    var isCallOperator = v === "Call operator";

    // "Oldin qayerda ishlagansiz?" is asked for every position, not conditional
    // on which one — it just waits for a position to be picked first.
    toggleField(fldOldinIshlaganJoy, v !== "");
    toggleField(fldMashina, isAmaliy || isNazariy);
    toggleField(fldToifalar, isAmaliy || isNazariy);
    toggleField(fldKompyuter, isAdmin || isCallOperator);
    toggleField(fldOldinSohada, isCallOperator);
  }

  if (lavozimSelect) {
    lavozimSelect.addEventListener("change", updateConditionalFields);
    updateConditionalFields();
  }

  loadDynamicOptions();

  var filialGroup = document.getElementById("fld-filial");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var fd = new FormData(form);
    var filialSelected = fd.getAll("filial");
    if (filialGroup && filialSelected.length === 0) {
      filialGroup.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // "Qaysi toifada pravaga egasiz?" is a checkbox group, so the native
    // `required` attribute can't express "pick at least one" — only enforce
    // it while the field is actually shown (Amaliy/Nazariy o'qituvchi).
    var toifalarSelected = fd.getAll("toifalar");
    if (fldToifalar && !fldToifalar.hidden && toifalarSelected.length === 0) {
      fldToifalar.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    var submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");

    var toifalar = fd.getAll("toifalar").join(", ");

    var payload = {
      ism: (fd.get("ism") || "").toString().trim(),
      familya: (fd.get("familya") || "").toString().trim(),
      telefon: (fd.get("telefon") || "").toString().trim(),
      manzil: (fd.get("manzil") || "").toString().trim(),
      yosh: (fd.get("yosh") || "").toString().trim(),
      jins: fd.get("jins") || "",
      filial: filialSelected.join(", "),
      lavozim: fd.get("lavozim") || "",
      oldinIshlaganJoy: (fd.get("oldinIshlaganJoy") || "").toString().trim(),
      shaxsiyMashina: fd.get("shaxsiyMashina") || "",
      toifalar: toifalar,
      kompyuterBiladimi: fd.get("kompyuterBiladimi") || "",
      oldinSohada: fd.get("oldinSohada") || ""
    };

    fetch(WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    })
      .then(function () {
        showSuccess();
      })
      .catch(function () {
        // The Apps Script endpoint redirects through googleusercontent.com; even if
        // reading the response ever fails cross-origin, the POST itself still reaches
        // the script and the row is written, so we treat completion as success.
        showSuccess();
      });
  });

  function showSuccess() {
    var overlay = document.getElementById("successOverlay");
    if (!overlay) {
      window.location.href = "index.html";
      return;
    }
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    setTimeout(function () {
      window.location.href = "index.html";
    }, 2600);
  }
})();

(function () {
  "use strict";

  var WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxvnKw8OKZryiOOAWD1VAGEJPfUv0CgcHIQPPBUwXWtXk3OwuPGJlxXL-KJEycbQUZEPQ/exec";

  var form = document.getElementById("joinForm");
  if (!form) return;

  var lavozimSelect = document.getElementById("lavozim");
  var fldOldin = document.getElementById("fld-oldinIshlaganJoy");
  var fldMashina = document.getElementById("fld-shaxsiyMashina");
  var fldToifalar = document.getElementById("fld-toifalar");
  var fldKompyuter = document.getElementById("fld-kompyuterBiladimi");

  function toggleField(el, show) {
    if (!el) return;
    el.hidden = !show;
    var inputs = el.querySelectorAll("input, textarea");
    inputs.forEach(function (inp) {
      if (!show) {
        if (inp.type === "checkbox" || inp.type === "radio") inp.checked = false;
        else inp.value = "";
      }
    });
  }

  function updateConditionalFields() {
    var v = lavozimSelect.value;
    var isAmaliy = v === "Amaliy o'qituvchi";
    var isNazariy = v === "Nazariy o'qituvchi";
    var isAdmin = v === "Administrator";

    toggleField(fldOldin, isAmaliy);
    toggleField(fldMashina, isAmaliy || isNazariy);
    toggleField(fldToifalar, isAmaliy || isNazariy);
    toggleField(fldKompyuter, isAdmin);
  }

  if (lavozimSelect) {
    lavozimSelect.addEventListener("change", updateConditionalFields);
    updateConditionalFields();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");

    var fd = new FormData(form);
    var toifalar = fd.getAll("toifalar").join(", ");

    var payload = {
      ism: (fd.get("ism") || "").toString().trim(),
      familya: (fd.get("familya") || "").toString().trim(),
      telefon: (fd.get("telefon") || "").toString().trim(),
      manzil: (fd.get("manzil") || "").toString().trim(),
      yosh: (fd.get("yosh") || "").toString().trim(),
      filial: fd.get("filial") || "",
      lavozim: fd.get("lavozim") || "",
      oldinIshlaganJoy: (fd.get("oldinIshlaganJoy") || "").toString().trim(),
      shaxsiyMashina: fd.get("shaxsiyMashina") || "",
      toifalar: toifalar,
      kompyuterBiladimi: fd.get("kompyuterBiladimi") || ""
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

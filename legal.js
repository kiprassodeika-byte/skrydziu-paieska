// Teisinių puslapių kalba: ta pati išsaugota kalba kaip pagrindiniame puslapyje (localStorage "lang").
(function () {
  let lang = null;
  try { lang = localStorage.getItem("lang"); } catch (e) { /* privatus režimas */ }
  if (lang !== "lt" && lang !== "en") lang = (navigator.language || "lt").toLowerCase().startsWith("lt") ? "lt" : "en";

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-l]").forEach((el) => (el.hidden = el.dataset.l !== lang));
    document.querySelectorAll(".lang").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
    const h1 = document.querySelector(`article[data-l="${lang}"] h1`);
    if (h1) document.title = `HopFriday · ${h1.textContent}`;
  }
  document.querySelectorAll(".lang").forEach((b) =>
    b.addEventListener("click", () => {
      lang = b.dataset.lang;
      try { localStorage.setItem("lang", lang); } catch (e) { /* privatus režimas */ }
      apply();
    })
  );
  apply();
})();

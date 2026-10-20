// Atsiliepimo langas: žvaigždutės, tekstas, neprivalomas kontaktas -> POST /api/feedback
(function () {
  const $ = (id) => document.getElementById(id);
  const dlg = $("feedbackDialog");
  let rating = 0;

  function paint() {
    document.querySelectorAll("#stars button").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.v) <= rating);
      b.setAttribute("aria-checked", String(Number(b.dataset.v) === rating));
    });
  }
  document.querySelectorAll("#stars button").forEach((b) =>
    b.addEventListener("click", () => {
      rating = rating === Number(b.dataset.v) ? 0 : Number(b.dataset.v);
      paint();
    })
  );
  $("feedbackOpen").addEventListener("click", () => {
    $("fbStatus").textContent = "";
    $("fbSend").disabled = false;
    dlg.showModal();
    $("fbMessage").focus();
  });
  $("fbCancel").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });  // paspaudimas ant tamsaus fono

  $("feedbackForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = $("fbMessage").value.trim();
    if (message.length < 3 && !rating) return ($("fbStatus").textContent = t("feedbackEmpty"));
    $("fbSend").disabled = true;
    $("fbStatus").textContent = "";
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message, contact: $("fbContact").value.trim(), lang: LANG, website: $("fbWebsite").value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "");
      $("fbStatus").textContent = t("feedbackThanks");
      $("fbMessage").value = "";
      $("fbContact").value = "";
      rating = 0;
      paint();
      setTimeout(() => { if (dlg.open) dlg.close(); }, 1800);
    } catch (err) {
      $("fbStatus").textContent = errText(err.message) || t("feedbackError");
      $("fbSend").disabled = false;
    }
  });
})();

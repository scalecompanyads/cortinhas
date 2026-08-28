/* ==========================================================================
   Cortinhas Advocacia — LP Direito Condominial
   ========================================================================== */

// TODO: substituir pelo número real da equipe jurídica (DDI+DDD+número, só dígitos)
const WHATSAPP_NUMBER = "5599999999999";

const WHATSAPP_DEFAULT_MESSAGE =
  "Olá, sou síndico(a) ou gestor(a) de um condomínio e gostaria de conversar sobre orientação jurídica para a administração condominial.";

// Envio dos leads por e-mail via EmailJS (emailjs.com), usando a caixa real
// advocacia@cortinhas.com.br como remetente/destinatário — evita o bloqueio
// que serviços terceiros genéricos (como o FormSubmit) sofreram no servidor
// de e-mail do domínio.
const EMAILJS_PUBLIC_KEY = "6xM3ecegYe3BAPRLH";
const EMAILJS_SERVICE_ID = "service_ozeb3m2";
const EMAILJS_TEMPLATE_ID = "template_vwpbgq9";

// Webhook do Make.com: dispara em paralelo ao e-mail, a cada envio do formulário.
const MAKE_WEBHOOK_URL = "https://hook.us1.make.com/yxsw8v5o6xw1v232ey7jdnqbemxet28p";

document.addEventListener("DOMContentLoaded", () => {
  if (typeof emailjs !== "undefined") {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
  initFaq();
  initForm();
  initThanksPage();
  initMarquee();
  initServicesCarousel();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* ---------- Carrossel de áreas de atuação (mobile) ---------- */
function initServicesCarousel() {
  const grid = document.querySelector(".services-grid");
  const prevBtn = document.getElementById("services-prev");
  const nextBtn = document.getElementById("services-next");
  if (!grid || !prevBtn || !nextBtn) return;

  function cardStep() {
    const card = grid.querySelector(".service-card");
    if (!card) return grid.clientWidth;
    const gap = parseFloat(getComputedStyle(grid).gap || "0");
    return card.getBoundingClientRect().width + gap;
  }

  function updateButtons() {
    const maxScroll = grid.scrollWidth - grid.clientWidth - 1;
    prevBtn.disabled = grid.scrollLeft <= 0;
    nextBtn.disabled = grid.scrollLeft >= maxScroll;
  }

  prevBtn.addEventListener("click", () => {
    grid.scrollBy({ left: -cardStep(), behavior: "smooth" });
  });

  nextBtn.addEventListener("click", () => {
    grid.scrollBy({ left: cardStep(), behavior: "smooth" });
  });

  grid.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  updateButtons();
}

/* ---------- Marquee (faixa de scroll infinito) ---------- */
function initMarquee() {
  const band = document.querySelector(".marquee-band");
  const track = band ? band.querySelector(".marquee-track") : null;
  const originalGroup = track ? track.querySelector(".marquee-group") : null;
  if (!band || !track || !originalGroup) return;

  const groupHTML = originalGroup.outerHTML;
  const PIXELS_PER_SECOND = 60;

  function build() {
    track.style.animationName = "none";
    track.innerHTML = groupHTML;

    const bandWidth = band.offsetWidth;
    const groupWidth = track.firstElementChild.offsetWidth || 1;
    const copiesPerHalf = Math.max(1, Math.ceil(bandWidth / groupWidth));

    for (let i = 1; i < copiesPerHalf; i++) {
      track.insertAdjacentHTML("beforeend", groupHTML);
    }
    // segunda metade idêntica: garante o loop contínuo sem salto visível
    for (let i = 0; i < copiesPerHalf; i++) {
      track.insertAdjacentHTML("beforeend", groupHTML);
    }

    Array.from(track.children).forEach((el, index) => {
      if (index > 0) el.setAttribute("aria-hidden", "true");
    });

    const halfWidth = track.scrollWidth / 2;
    track.style.animationDuration = `${halfWidth / PIXELS_PER_SECOND}s`;

    void track.offsetWidth; // força reflow antes de religar a animação
    track.style.animationName = "marquee-scroll";
  }

  build();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });
}

/* ---------- FAQ accordion ---------- */
function initFaq() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    question.addEventListener("click", () => {
      const isOpen = item.getAttribute("data-open") === "true";
      items.forEach((other) => {
        other.setAttribute("data-open", "false");
        other.querySelector(".faq-answer").style.maxHeight = null;
      });
      if (!isOpen) {
        item.setAttribute("data-open", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
}

/* ---------- Multi-step form ---------- */
function initForm() {
  const form = document.getElementById("lead-form");
  if (!form) return;

  const steps = form.querySelectorAll(".form-step");
  const segs = document.querySelectorAll(".progress-bar .seg");
  const progressLabel = document.getElementById("progress-label");
  const btnNext = document.getElementById("btn-next");
  const btnBack = document.getElementById("btn-back");
  const formError = document.getElementById("form-error");
  const whatsappInput = document.getElementById("whatsapp");
  const urgenciaRadios = form.querySelectorAll('input[name="urgencia"]');
  const campoUrgenciaDetalhe = document.getElementById("campo-urgencia-detalhe");

  function goToStep(step) {
    steps.forEach((el) => el.classList.toggle("active", Number(el.dataset.step) === step));
    segs.forEach((seg) => seg.classList.toggle("active", Number(seg.dataset.seg) <= step));
    progressLabel.textContent = `Etapa ${step} de ${steps.length}`;
    formError.classList.remove("visible");
  }

  function validateStep(step) {
    const stepEl = form.querySelector(`.form-step[data-step="${step}"]`);
    const fields = stepEl.querySelectorAll("[required]");
    let valid = true;

    fields.forEach((field) => {
      if (field.type === "radio") {
        const group = stepEl.querySelectorAll(`input[name="${field.name}"]`);
        const checked = Array.from(group).some((r) => r.checked);
        if (!checked) valid = false;
      } else if (!field.value.trim()) {
        valid = false;
      }
    });

    return valid;
  }

  if (whatsappInput) {
    whatsappInput.addEventListener("input", () => {
      whatsappInput.value = formatPhone(whatsappInput.value);
    });
  }

  urgenciaRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      campoUrgenciaDetalhe.style.display = radio.value === "Sim" ? "block" : "none";
    });
  });

  btnNext.addEventListener("click", () => {
    if (!validateStep(1)) {
      formError.classList.add("visible");
      return;
    }
    goToStep(2);
  });

  btnBack.addEventListener("click", () => goToStep(1));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(2)) {
      formError.classList.add("visible");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    sessionStorage.setItem("condolp_lead", JSON.stringify(data));

    const btnSubmit = document.getElementById("btn-submit");
    if (btnSubmit) btnSubmit.disabled = true;

    // Dispara e-mail e webhook em paralelo; nenhum dos dois bloqueia o funil
    // se falhar — o WhatsApp na página de obrigado segue como canal de contato.
    const results = await Promise.allSettled([sendLeadEmail(data), sendLeadWebhook(data)]);
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const label = index === 0 ? "e-mail (EmailJS)" : "webhook (Make.com)";
        console.error(`Falha ao enviar lead por ${label}:`, result.reason);
      }
    });

    window.location.href = "obrigado.html";
  });

  goToStep(1);
}

/* ---------- Envio do lead por e-mail (EmailJS) ---------- */
async function sendLeadEmail(data) {
  if (typeof emailjs === "undefined") {
    throw new Error("SDK do EmailJS não carregado.");
  }
  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, data);
}

/* ---------- Envio do lead via webhook (Make.com) ---------- */
async function sendLeadWebhook(data) {
  await fetch(MAKE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

function formatPhone(value) {
  let digits = value.replace(/\D/g, "");

  // Autopreenchimento do navegador às vezes inclui o DDI 55 (ex.: +55 19 99999-9999).
  // Só remove quando sobrar dígito além de um número completo (DDD+telefone),
  // pra não confundir com DDD 55 (Rio Grande do Sul), que é um DDD real.
  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/* ---------- Thank you page ---------- */
function initThanksPage() {
  const link = document.getElementById("whatsapp-link");
  if (!link) return;

  let lead = {};
  try {
    lead = JSON.parse(sessionStorage.getItem("condolp_lead") || "{}");
  } catch (e) {
    lead = {};
  }
  const leadName = lead.nome ? lead.nome.split(" ")[0] : "";

  // Dispara o evento de conversão para o GTM (container GTM-KWSZKRH3).
  // No painel do GTM, crie uma tag "Google Ads Conversion Tracking" com
  // ID AW-18382324417 / rótulo i9FfCK7V5-EcEMGFsL1E, disparada por este
  // evento personalizado.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "generate_lead" });

  const message = encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE);
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  if (leadName) {
    const msgEl = document.getElementById("thanks-message");
    if (msgEl) {
      msgEl.textContent = `${leadName}, recebemos seu contato. Nossa equipe jurídica vai analisar as informações e falar com você em breve.`;
    }
  }
}

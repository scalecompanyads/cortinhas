/* ==========================================================================
   Cortinhas Advocacia — LP Direito Condominial
   ========================================================================== */

// TODO: substituir pelo número real da equipe jurídica (DDI+DDD+número, só dígitos)
const WHATSAPP_NUMBER = "5599999999999";

const WHATSAPP_DEFAULT_MESSAGE =
  "Olá, sou síndico(a) ou gestor(a) de um condomínio e gostaria de conversar sobre orientação jurídica para a administração condominial.";

// E-mail que recebe os leads do formulário via FormSubmit (formsubmit.co).
// Na primeira submissão, o FormSubmit envia um e-mail de confirmação para este
// endereço — é preciso clicar no link de confirmação para os envios seguintes
// caírem na caixa de entrada normalmente.
const LEAD_EMAIL = "advocacia@cortinhas.com.br";

document.addEventListener("DOMContentLoaded", () => {
  initFaq();
  initForm();
  initThanksPage();
  initMarquee();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

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

    try {
      await sendLeadEmail(data);
    } catch (err) {
      // Não bloqueia o funil por falha no envio do e-mail: o WhatsApp na
      // página de obrigado segue como canal de contato mesmo nesse caso.
      console.error("Falha ao enviar lead por e-mail:", err);
    }

    trackConversion(data);

    window.location.href = "obrigado.html";
  });

  goToStep(1);
}

/* ---------- Envio do lead por e-mail (FormSubmit) ---------- */
async function sendLeadEmail(data) {
  const payload = new URLSearchParams({
    _subject: "Novo lead - LP Direito Condominial (Cortinhas Advocacia)",
    ...data,
  });

  await fetch(`https://formsubmit.co/ajax/${LEAD_EMAIL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: payload.toString(),
  });
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/* ---------- Google Ads conversion (placeholder) ---------- */
function trackConversion(data) {
  // Quando o Google Ads/GTM estiverem instalados, dispare a conversão aqui, ex:
  // gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/XXXXXXXXXXXXXXXXXXXX' });
  if (typeof gtag === "function") {
    gtag("event", "generate_lead", { event_category: "Formulário LP Direito Condominial" });
  }
}

/* ---------- Thank you page ---------- */
function initThanksPage() {
  const link = document.getElementById("whatsapp-link");
  if (!link) return;

  let leadName = "";
  try {
    const lead = JSON.parse(sessionStorage.getItem("condolp_lead") || "{}");
    leadName = lead.nome ? lead.nome.split(" ")[0] : "";
  } catch (e) {
    leadName = "";
  }

  const message = encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE);
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  if (leadName) {
    const msgEl = document.getElementById("thanks-message");
    if (msgEl) {
      msgEl.textContent = `${leadName}, recebemos seu contato. Nossa equipe jurídica vai analisar as informações e falar com você em breve.`;
    }
  }
}

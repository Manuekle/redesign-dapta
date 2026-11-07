// Dapta home on blindem's scripts. app.js, ui.js, controls.js, nav.js, command.js and ai.js are blindem's, unchanged
// except command.js's record kinds; this file only wires what the Dapta screen adds. It reuses their globals:
// icon() from app.js, thinking(), stream(), escapeHtml() and wait() from ai.js, window.toast from ui.js.
(() => {
  const root = document.documentElement;

  // Dates the server would print (blindem: now()->translatedFormat('d M Y') and now()->format('d/m/Y')).
  const today = new Date();
  const long = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(today).replace('.', '');
  const short = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(today);
  document.querySelectorAll('[data-today]').forEach(node => { node.textContent = node.dataset.today === 'long' ? long : short; });

  // Collapsed rail: blindem binds the first nav group only (it has one). Every Dapta group gets the same behaviour:
  // in the rail a group has no room for its list, so expand the sidebar and open it.
  const desktop = window.matchMedia('(min-width: 1024px)');
  document.querySelectorAll('.nav-group > summary').forEach((summary, index) => {
    if (index === 0) return;
    summary.addEventListener('click', event => {
      if (!root.classList.contains('sidebar-collapsed') || !desktop.matches) return;
      event.preventDefault();
      document.querySelector('#sidebar-collapse')?.click();
      summary.parentElement.open = true;
    });
  });

  // Workspace switch: blindem's custom select fires a native change.
  document.querySelector('#workspace')?.addEventListener('change', event => {
    const label = event.target.selectedOptions[0]?.textContent;
    window.toast?.({ type: 'info', title: `Espacio: ${label}`, message: 'En la app real cambiaría de espacio de trabajo.' });
  });

  // ── Dapti composer ──────────────────────────────────────────────────────
  const form = document.querySelector('[data-dapti-form]');
  if (form) {
    const input = form.querySelector('textarea');
    const send = form.querySelector('.ai-send');
    const output = document.querySelector('.dapti-output');
    const hero = form.closest('.home-hero');
    const sync = () => { send.disabled = input.value.trim().length < 2; };

    document.querySelectorAll('[data-prompt]').forEach(chip => chip.addEventListener('click', () => {
      input.value = chip.dataset.prompt;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      sync();
    }));
    input.addEventListener('input', sync);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    const reply = text => {
      const q = text.toLowerCase();
      if (q.includes('voz')) return 'Perfecto. Para tu agente de voz necesito tres cosas: qué debe lograr en cada llamada, el tono de la voz y el número desde el que va a llamar. Empecemos por el objetivo: ¿agenda citas, califica leads o atiende soporte?';
      if (q.includes('texto') || q.includes('whatsapp')) return 'Listo. Un agente de texto vive en un canal: WhatsApp, web o Instagram. Dime en cuál quieres empezar y qué preguntas frecuentes debe resolver, y armo el primer prompt.';
      if (q.includes('flujo') || q.includes('automatiz')) return 'Buen punto de partida. Un flujo arranca con un disparador (formulario, llamada terminada, fila nueva en Sheets) y encadena acciones. ¿Qué evento debería iniciarlo?';
      if (q.includes('reunión') || q.includes('reunion')) return 'Conecta tu calendario y el AI Notetaker se unirá a la reunión, la transcribirá y te dejará un resumen con tareas asignadas.';
      return 'Entendido. Puedo ayudarte a crear agentes de voz o de texto, automatizar flujos en Flow Studio o resumir reuniones. ¿Por cuál empezamos?';
    };

    const add = (kind, html) => {
      const message = document.createElement('div');
      message.className = `thread-msg is-${kind}`;
      message.innerHTML = html;
      output.append(message);
      return message;
    };

    // blindem's palette hands questions to window.agent (its floating assistant); here Dapti is that assistant.
    window.agent = {
      open: () => { document.querySelector('#dapti')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); input.focus({ preventScroll: true }); },
      ask: text => { window.agent.open(); input.value = text; sync(); form.requestSubmit(); },
    };

    let busy = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const text = input.value.trim();
      if (text.length < 2 || busy) return;
      busy = true;
      input.value = '';
      sync();
      hero?.classList.add('is-chatting');
      add('user', `<p>${escapeHtml(text)}</p>`);
      const answer = add('ai', `<img class="dapti-avatar" src="/img/dapti-avatar.webp" alt="" width="32" height="32"><div><b class="thread-name">Dapti</b><div data-slot></div></div>`);
      const slot = answer.querySelector('[data-slot]');
      window.sound?.play('loading', { emphasis: 'subtle' });
      const stop = thinking(slot, 'Pensando');
      await wait(900);
      stop();
      slot.innerHTML = '<p></p>';
      await stream(slot.firstChild, reply(text));
      window.sound?.play('ready', { emphasis: 'subtle' });
      busy = false;
      input.focus({ preventScroll: true });
    });
    sync();
  }

  // ── Dapti around the chat ──────────────────────────────────────────────
  // One pose per hour: the hour of the day picks it from the poses that fit (side poses need room between the
  // composer and the edge of the page content, which clips anything wider), so a reload within the same hour shows
  // the same Dapti. It comes out from behind the chat on load and at each change of hour (CSS does the motion);
  // with reduced motion it simply appears. If the window narrows and the current pose no longer fits, Dapti swaps
  // to one that does.
  const stage = document.querySelector('[data-dapti-stage]');
  if (stage) {
    const poses = [...stage.querySelectorAll('.dapti-pose')];
    const composer = stage.querySelector('.composer');
    const content = document.querySelector('#main-content');
    const ORDER = ['top', 'right', 'left', 'wave'];
    const ROOM = { right: 104, left: 100, wave: 82 };
    const OUT_MS = 560;
    let current = null;

    const fits = pose => {
      if (pose === 'top') return true;
      const c = composer.getBoundingClientRect();
      const area = content.getBoundingClientRect();
      return (pose === 'left' ? c.left - area.left : area.right - c.right) >= ROOM[pose];
    };
    const poseForNow = () => {
      const start = new Date().getHours() % ORDER.length;
      for (let step = 0; step < ORDER.length; step++) {
        const pose = ORDER[(start + step) % ORDER.length];
        if (fits(pose)) return pose;
      }
      return 'top';
    };
    const show = pose => {
      if (pose === current) return;
      const had = current;
      current = pose;
      poses.forEach(img => img.classList.remove('is-shown'));
      // Let the previous pose slide back behind the chat before the next one comes out.
      setTimeout(() => {
        if (current === pose) stage.querySelector(`[data-pose="${pose}"]`)?.classList.add('is-shown');
      }, had ? OUT_MS : 0);
    };
    const everyHour = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(now.getHours() + 1, 0, 0, 50);
      setTimeout(() => { show(poseForNow()); everyHour(); }, next - now);
    };

    // Start after the first paint so the entrance is visible.
    requestAnimationFrame(() => requestAnimationFrame(() => show(poseForNow())));
    everyHour();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (current && !fits(current)) show(poseForNow()); }, 150);
    });
  }

  // ── Dapta Academy ───────────────────────────────────────────────────────
  const COPY = {
    es: { subtitle: 'Aprende con cursos prácticos y consejos de expertos: elige un tema y comienza.', docs: 'Documentación', all: 'Ver todo', all_filter: 'Todos', empty: 'Aún no hay cursos en este tema.' },
    en: { subtitle: 'Learn with hands-on courses and expert tips: pick a topic and get started.', docs: 'Documentation', all: 'View all', all_filter: 'All', empty: 'No courses on this topic yet.' },
  };
  const TOPICS = {
    start: { es: 'Primeros pasos', en: 'Getting started' },
    voice: { es: 'Agentes de voz', en: 'Voice agents' },
    text: { es: 'Agentes de texto', en: 'Text agents' },
    cases: { es: 'Casos de uso', en: 'Use cases' },
    integrations: { es: 'Integraciones', en: 'Integrations' },
    flow: { es: 'Flow Studio', en: 'Flow Studio' },
  };
  // headline: the [bracketed] part is highlighted in lime, like the thumbnails.
  const COURSES = [
    { topic: 'start', time: '0:46', hue: 150, es: ['Bienvenida a Dapta Academy', '[Bienvenida]'], en: ['Welcome to Dapta Academy', '[Welcome]'] },
    { topic: 'start', time: '3:42', hue: 210, es: ['Crea tu cuenta en Dapta + workspaces y configuración inicial', 'Crea tu cuenta en [Dapta]'], en: ['Create your Dapta account + workspaces and setup', 'Create your [Dapta] account'] },
    { topic: 'voice', time: '5:24', hue: 30, es: ['Crea tu primer agente de voz con IA en Dapta', 'Crea tu primer [agente de voz]'], en: ['Build your first AI voice agent in Dapta', 'Your first [voice agent]'] },
    { topic: 'voice', time: '6:14', hue: 260, es: ['Cómo configurar tu agente de voz en Dapta', 'Configura tu [agente de voz]'], en: ['How to configure your voice agent in Dapta', 'Configure your [voice agent]'] },
    { topic: 'voice', time: '6:17', hue: 190, es: ['Cómo editar el prompt de tu agente en Dapta', 'Edita los [prompts] de tus agentes'], en: ['How to edit your agent prompt in Dapta', 'Edit your agent [prompts]'] },
    { topic: 'text', time: '4:04', hue: 100, es: ['Crea tu primer agente de texto en Dapta', 'Crea tu primer [agente de texto]'], en: ['Build your first text agent in Dapta', 'Your first [text agent]'] },
    { topic: 'text', time: '5:02', hue: 330, es: ['Configura los canales de tu agente de texto', 'Configura tus [canales]'], en: ['Set up your text agent channels', 'Set up your [channels]'] },
    { topic: 'integrations', time: '7:31', hue: 15, es: ['Conecta HubSpot y Google Sheets a tus agentes', 'Conecta tus [herramientas]'], en: ['Connect HubSpot and Google Sheets to your agents', 'Connect your [tools]'] },
    { topic: 'flow', time: '8:05', hue: 280, es: ['Automatiza tu primer flujo en Flow Studio', 'Tu primer [flujo]'], en: ['Automate your first flow in Flow Studio', 'Your first [flow]'] },
    { topic: 'cases', time: '9:12', hue: 60, es: ['Agente de cobranza: caso de uso completo', 'Caso de uso: [cobranza]'], en: ['Collections agent: a complete use case', 'Use case: [collections]'] },
  ];

  const academy = document.querySelector('#academy');
  if (academy) {
    const row = academy.querySelector('[data-academy-row]');
    const filters = academy.querySelector('[data-academy-filters]');
    const [prev, next] = academy.querySelectorAll('[data-academy-scroll]');
    let lang = 'es';
    let topic = 'all';
    const safe = text => (typeof escapeHtml === 'function' ? escapeHtml(text) : text);
    const headline = text => safe(text).replace(/\[([^\]]+)\]/g, '<mark>$1</mark>');
    const svg = name => (typeof icon === 'function' ? icon(name) : '');

    const edges = () => {
      const end = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
      prev.hidden = row.scrollLeft <= 4;
      next.hidden = end;
    };

    const render = () => {
      const t = COPY[lang];
      academy.querySelectorAll('[data-academy-copy]').forEach(node => { node.textContent = t[node.dataset.academyCopy]; });
      filters.innerHTML = [['all', t.all_filter], ...Object.entries(TOPICS).map(([key, label]) => [key, label[lang]])]
        .map(([key, label]) => `<button type="button" class="ai-chip" data-topic="${key}" aria-pressed="${key === topic}">${safe(label)}</button>`).join('');
      const shown = COURSES.filter(course => topic === 'all' || course.topic === topic);
      row.innerHTML = shown.length ? shown.map(course => {
        const [title, thumb] = course[lang];
        return `<li><a class="surface academy-card" href="#academy" aria-label="${safe(title)} · ${course.time}"><div class="academy-thumb" style="--hue:${course.hue}"><span class="academy-thumb-brand"><svg aria-hidden="true" focusable="false" viewBox="0 0 1600 513"><use href="/icons/hugeicons.svg#dapta-wordmark"/></svg>Academy</span><p class="academy-thumb-title">${headline(thumb)}</p><span class="academy-duration">${course.time}</span><span class="academy-play" aria-hidden="true"><span>${svg('play')}</span></span></div><div class="academy-body"><small>${safe(TOPICS[course.topic][lang])}</small><b>${safe(title)}</b></div></a></li>`;
      }).join('') : `<li class="academy-empty">${safe(t.empty)}</li>`;
      row.scrollLeft = 0;
      requestAnimationFrame(edges);
    };

    filters.addEventListener('click', event => {
      const chip = event.target.closest('[data-topic]');
      if (!chip) return;
      topic = chip.dataset.topic;
      render();
      filters.querySelector(`[data-topic="${topic}"]`)?.focus();
    });
    academy.querySelectorAll('input[name="academy-lang"]').forEach(radio => radio.addEventListener('change', () => {
      lang = radio.value;
      render();
    }));
    [prev, next].forEach(button => button.addEventListener('click', () => {
      row.scrollBy({ left: Number(button.dataset.academyScroll) * row.clientWidth * 0.8, behavior: 'smooth' });
    }));
    row.addEventListener('scroll', edges, { passive: true });
    new ResizeObserver(edges).observe(row);
    render();
  }
})();

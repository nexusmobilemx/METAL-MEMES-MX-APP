// ============================================================
// Metal Memes MX — lógica de la app
// ============================================================

// ---------- Utilidades ----------
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const FALLBACK_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2c34"/><stop offset="1" stop-color="#0d0e12"/></linearGradient></defs>' +
  '<rect width="800" height="1000" fill="url(#g)"/>' +
  '<path d="M400 330L220 650h360L400 330zm0 90l105 190H295l105-190z" fill="#FF2A44" opacity=".35"/></svg>'
);

const STORE_KEY = 'metalMemesMX.v1';
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
}
function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      headline: $('inputHeadline').value,
      sub: $('inputSubheadline').value,
      img: currentImage.startsWith('data:') ? null : currentImage,
      ratio: currentRatio,
      tone: currentTone,
      caption: $('captionBox').value,
      tags: tags,
      processed: [...processed]
    }));
  } catch (e) { /* almacenamiento no disponible */ }
}

let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2500);
}

// ---------- Estado ----------
let currentRatio = '3:4';
let currentTone = 'metalero';
let currentImage = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';
let imageSetByUser = false;
let activeGenre = 'TODAS';
const processed = new Set();
const lastVariant = {};

// ---------- Navegación ----------
const tabs = ['noticias', 'plantilla', 'caption', 'publicar'];
const tabSubtitles = {
  noticias: '// NOTICIAS & RADAR',
  plantilla: '// EDITOR DE PLANTILLA',
  caption: '// GENERADOR DE CAPTION',
  publicar: '// PUBLICAR EN INSTAGRAM'
};

function goToTab(tabName) {
  tabs.forEach((t) => {
    const el = $('tab-' + t);
    const nav = $('nav-' + t);
    if (t === tabName) {
      el.classList.remove('hidden');
      nav.className = 'flex flex-col items-center gap-1 text-[#FF2A44] text-[10px] font-code font-bold transition';
    } else {
      el.classList.add('hidden');
      nav.className = 'flex flex-col items-center gap-1 text-gray-500 hover:text-white text-[10px] font-code transition';
    }
  });
  $('topBarSubtitle').innerText = tabSubtitles[tabName];
  if (tabName === 'publicar') updateCharCount();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generateAndGo() {
  regenerateCaption(currentTone);
  saveState();
  goToTab('caption');
}

// ---------- Noticias ----------
const IMG_A = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop';
const IMG_B = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';
const IMG_C = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop';

// Datos de ejemplo: reemplázalos por tus fuentes reales.
const NEWS = [
  { id: 1, genre: 'THRASH', tag: '#THRASH_TITANS', source: 'BLABBERMOUTH', viral: 94, time: 'HACE 24 MIN', band: 'SLAYER Y METALLICA',
    title: 'Slayer y Metallica confirman fechas conjuntas: "Será la gira definitiva"',
    summary: 'Kerry King y James Hetfield rompieron el silencio en conferencia confirmando 18 estadios de Latinoamérica.',
    headline: 'SLAYER Y METALLICA', sub: 'CONFIRMAN FECHAS CONJUNTAS EN LATINOAMÉRICA: LA GIRA DEFINITIVA', img: IMG_A },
  { id: 2, genre: 'HEAVY', tag: '// RECORD SPOTIFY', source: 'SPOTIFY', viral: 88, time: 'HACE 1 H', band: 'OZZY OSBOURNE',
    title: 'Ozzy Osbourne supera mil millones',
    summary: 'Crazy Train alcanza récord histórico en streaming.',
    headline: 'OZZY OSBOURNE', sub: 'CRAZY TRAIN SUPERA LOS MIL MILLONES DE REPRODUCCIONES', img: IMG_B },
  { id: 3, genre: 'DEATH METAL', tag: '// GIRA', source: 'METAL INJECTION', viral: 81, time: 'HACE 2 H', band: 'CANNIBAL CORPSE',
    title: 'Cannibal Corpse anuncia gira por México',
    summary: 'Tres fechas confirmadas: CDMX, Guadalajara y Monterrey.',
    headline: 'CANNIBAL CORPSE', sub: 'ANUNCIA GIRA POR MÉXICO CON TRES FECHAS CONFIRMADAS', img: IMG_C },
  { id: 4, genre: 'BLACK', tag: '// FESTIVAL', source: 'ROCKZONE', viral: 76, time: 'HACE 3 H', band: 'MAYHEM',
    title: 'Mayhem encabezará festival de metal extremo',
    summary: 'El cartel completo se revelará la próxima semana.',
    headline: 'MAYHEM', sub: 'ENCABEZARÁ FESTIVAL DE METAL EXTREMO EN LATINOAMÉRICA', img: IMG_A },
  { id: 5, genre: 'THRASH', tag: '// NUEVO ÁLBUM', source: 'METAL HAMMER', viral: 72, time: 'HACE 5 H', band: 'ANTHRAX',
    title: 'Anthrax adelanta su nuevo disco',
    summary: 'El sencillo principal llegará este viernes.',
    headline: 'ANTHRAX', sub: 'ADELANTA SU NUEVO DISCO Y ESTRENA SENCILLO ESTE VIERNES', img: IMG_B },
  { id: 6, genre: 'HEAVY', tag: '// RUMOR', source: 'LOUDWIRE', viral: 69, time: 'HACE 6 H', band: 'IRON MAIDEN',
    title: 'Rumor: Iron Maiden regresaría a México',
    summary: 'Fuentes de la industria apuntan a un estadio en 2027.',
    headline: 'IRON MAIDEN', sub: 'RUMOR: REGRESARÍAN A MÉXICO EN 2027', img: IMG_C }
];

const GENRES = ['TODAS', 'THRASH', 'DEATH METAL', 'BLACK', 'HEAVY'];

function norm(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function filteredNews() {
  const q = norm($('newsSearch').value.trim());
  return NEWS.filter((n) => {
    if (activeGenre !== 'TODAS' && n.genre !== activeGenre) return false;
    if (!q) return true;
    return norm([n.band, n.title, n.summary, n.source, n.tag, n.genre].join(' ')).includes(q);
  });
}

function renderGenres() {
  $('genreTags').innerHTML = GENRES.map((g) => {
    const count = g === 'TODAS' ? NEWS.length : NEWS.filter((n) => n.genre === g).length;
    const on = g === activeGenre;
    const cls = on ? 'bg-[#FF2A44] text-white' : 'bg-[#1A1B20] text-gray-400 border border-[#2B2D38]';
    const label = g === 'TODAS' ? `🔥 TODAS (${count})` : g;
    return `<button onclick="setGenre('${g}')" class="${cls} px-3 py-1 rounded-md shrink-0">${label}</button>`;
  }).join('');
}

function setGenre(g) {
  activeGenre = g;
  renderGenres();
  renderNews();
}

function renderNews() {
  const list = filteredNews();
  $('newsEmpty').classList.toggle('hidden', list.length > 0);
  $('newsList').innerHTML = list.map((n, i) => {
    const used = processed.has(n.id);
    const usedBadge = used ? '<span class="text-[9px] font-code text-green-400">✓ USADA</span>' : '';
    if (i === 0) {
      return `
      <div class="bg-[#121317] border border-[#252733] rounded-xl overflow-hidden shadow-lg space-y-3">
        <div class="relative aspect-video bg-neutral-900">
          <img src="${esc(n.img)}" onerror="this.onerror=null;this.src=FALLBACK_IMG" class="w-full h-full object-cover filter grayscale contrast-125" alt="${esc(n.band)}">
          <div class="absolute inset-0 bg-gradient-to-t from-[#121317] via-transparent to-transparent"></div>
          <span class="absolute top-3 left-3 text-[10px] font-code bg-red-600 text-white font-bold px-2 py-0.5 rounded">${n.viral}% VIRALIDAD</span>
          <span class="absolute top-3 right-3 text-[10px] font-code bg-black/70 text-gray-300 px-2 py-0.5 rounded border border-white/10">${esc(n.source)}</span>
        </div>
        <div class="p-4 pt-1 space-y-2">
          <div class="flex items-center justify-between text-[10px] font-code text-gray-400">
            <span>${esc(n.tag)} ${usedBadge}</span>
            <span>${esc(n.time)}</span>
          </div>
          <h3 class="text-xl font-metal text-white leading-tight uppercase">${esc(n.title)}</h3>
          <p class="text-xs text-gray-400 leading-relaxed font-sans">${esc(n.summary)}</p>
          <button onclick="useNews(${n.id})" class="w-full py-2.5 bg-[#FF2A44] hover:bg-red-600 text-white font-metal text-sm tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition">
            🪄 USAR EN PLANTILLA
          </button>
        </div>
      </div>`;
    }
    return `
      <div class="bg-[#16171E] border border-[#252733] rounded-xl p-3 flex gap-3 items-center">
        <img src="${esc(n.img)}" onerror="this.onerror=null;this.src=FALLBACK_IMG" class="w-20 h-20 rounded-lg object-cover grayscale shrink-0 bg-neutral-900" alt="${esc(n.band)}">
        <div class="flex-1 min-w-0 space-y-1">
          <span class="text-[9px] font-code text-red-400 font-bold">${esc(n.tag)} ${usedBadge}</span>
          <h4 class="text-sm font-metal text-white truncate uppercase">${esc(n.title)}</h4>
          <p class="text-[11px] text-gray-400 truncate">${esc(n.summary)}</p>
          <button onclick="useNews(${n.id})" class="text-[10px] font-code text-red-400 font-bold hover:underline">→ Enviar a editor</button>
        </div>
      </div>`;
  }).join('');
  const pending = NEWS.filter((n) => !processed.has(n.id)).length;
  $('unprocessedBadge').innerText = `${pending} SIN PROCESAR`;
}

function useNews(id) {
  const n = NEWS.find((x) => x.id === id);
  if (!n) return;
  processed.add(id);
  $('inputHeadline').value = n.headline;
  $('inputSubheadline').value = n.sub;
  updateHeadline(n.headline);
  updateSubheadline(n.sub);
  updateImage(n.img);
  renderNews();
  saveState();
  goToTab('plantilla');
}

// Compatibilidad con llamadas antiguas
function useNewsInTemplate(headline, subheadline) {
  $('inputHeadline').value = headline;
  $('inputSubheadline').value = subheadline;
  updateHeadline(headline);
  updateSubheadline(subheadline);
  goToTab('plantilla');
}

// ---------- Editor de plantilla ----------
function updateHeadline(text) {
  const val = text.toUpperCase();
  $('previewHeadline').innerText = val;
  $('postHeadline').innerText = val;
  refreshBandTag();
  saveState();
}

function updateSubheadline(text) {
  const val = text.toUpperCase();
  $('previewSubheadline').innerText = val;
  $('postSubheadline').innerText = val;
  saveState();
}

function setImageSrc(src) {
  currentImage = src;
  $('bgImage').src = src;
  $('postPreviewImg').src = src;
}

function updateImage(url) {
  if (url && url.trim() !== '') {
    imageSetByUser = true;
    setImageSrc(url.trim());
    saveState();
  }
}

function imgFallback(img) {
  if (img.src === FALLBACK_IMG) return;
  const failed = currentImage;
  setImageSrc(FALLBACK_IMG);
  if (imageSetByUser) toast('No se pudo cargar la imagen: ' + failed.slice(0, 40));
}

function uploadLocalImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    imageSetByUser = true;
    setImageSrc(e.target.result);
  };
  reader.onerror = () => toast('No se pudo leer el archivo');
  reader.readAsDataURL(file);
  event.target.value = '';
}

const RATIOS = {
  '1:1': { w: 1080, h: 1080, cls: 'aspect-[1/1]', label: '1:1 FEED (1080 × 1080)', btn: 'btn-1-1', short: '1:1 HD (1080×1080)' },
  '3:4': { w: 1080, h: 1440, cls: 'aspect-[3/4]', label: '3:4 FEED (1080 × 1440)', btn: 'btn-3-4', short: '3:4 HD (1080×1440)' },
  '9:16': { w: 1080, h: 1920, cls: 'aspect-[9/16]', label: '9:16 STORY (1080 × 1920)', btn: 'btn-9-16', short: '9:16 HD (1080×1920)' }
};
const BTN_OFF = 'format-btn py-2 px-3 rounded bg-[#1A1B20] border border-[#2B2D38] text-xs font-code font-bold text-gray-400 hover:text-white transition flex flex-col items-center gap-1';
const BTN_ON = 'format-btn py-2 px-3 rounded bg-[#FF2A44] border border-[#FF2A44] text-xs font-code font-bold text-white shadow-lg shadow-red-950 flex flex-col items-center gap-1';

function setRatio(ratio) {
  const r = RATIOS[ratio];
  if (!r) return;
  currentRatio = ratio;
  Object.values(RATIOS).forEach((x) => { $(x.btn).className = BTN_OFF; });
  $(r.btn).className = BTN_ON;
  $('memeCanvas').className = `w-full max-w-[340px] ${r.cls} bg-neutral-900 rounded-lg overflow-hidden relative shadow-2xl flex flex-col justify-between select-none border border-neutral-800 transition-all duration-300`;
  $('currentFormatBadge').innerText = r.label;
  $('postImageBox').className = `relative ${r.cls} bg-neutral-900 overflow-hidden`;
  $('postRatioBadge').innerText = r.short;
  $('downloadLabel').innerText = `📥 DESCARGAR IMAGEN HD (${r.w} × ${r.h} PX)`;
  saveState();
}

const examples = [
  { band: 'METALLICA', news: 'CONFIRMA NUEVA FECHA EN MÉXICO TRAS HISTÓRICO SOLD OUT', img: IMG_B },
  { band: 'OZZY OSBOURNE', news: 'CRAZY TRAIN LLEGA A LOS MIL MILLONES EN SPOTIFY', img: IMG_A },
  { band: 'SLIPKNOT', news: 'ELOGIAN AL PÚBLICO MEXICANO: "EL MÁS SALVAJE DEL PLANETA"', img: IMG_C }
];
let exIdx = 0;
function randomizeBand() {
  exIdx = (exIdx + 1) % examples.length;
  const cur = examples[exIdx];
  $('inputHeadline').value = cur.band;
  $('inputSubheadline').value = cur.news;
  updateHeadline(cur.band);
  updateSubheadline(cur.news);
  updateImage(cur.img);
}

// ---------- Caption ----------
const TONES = ['metalero', 'meme', 'periodistico', 'debate'];
const TONE_ON = 'p-3 rounded-lg bg-[#FF2A44]/15 border border-[#FF2A44] text-left transition';
const TONE_OFF = 'p-3 rounded-lg bg-[#16171E] border border-[#2B2D38] text-left transition';

const COPY = {
  metalero: [
    (b, n) => `¡HISTÓRICO! ⚡ ${b}: ${n}. 🤘 ¿Cuál es esa rola que NO puede faltar en el setlist? Déjalo en comentarios y etiqueta a tu compa del mosh pit.`,
    (b, n) => `Se nos enchina la piel, banda. 🔥 ${b} — ${n}. Esto es pa' los que llevamos el metal en la sangre. ¿Quién va a estar en primera fila? 🤘`,
    (b, n) => `HORNS UP, METALHEADS 🤘 ${n}. ${b} nos recuerda por qué esto nunca muere. Comparte con tu hermandad metalera.`
  ],
  meme: [
    (b, n) => `Mi cartera llorando en una esquina y yo a punto de vender un riñón porque ${b}: ${n}. 💀 Prioridades claras, banda. Etiqueta al que te debe una chela en el concierto.`,
    (b, n) => `Yo: "este año ya no gasto en conciertos". ${b}: ${n}. Yo: 🤡 ¿Quién más ya está viendo cuánto cuesta un riñón?`,
    (b, n) => `Mi mamá: "¿otra vez metal?" Yo, con ${b} en la mente: ${n}. 😈 Etiqueta a quien te debe una chela.`
  ],
  periodistico: [
    (b, n) => `OFICIAL: ${b} — ${n}. Detalles y fechas completas en el link de la biografía.`,
    (b, n) => `ÚLTIMA HORA | ${b}: ${n}. Mantente al tanto de más información en nuestro canal de YouTube.`,
    (b, n) => `Se confirma: ${n}. La agrupación ${b} dio a conocer los detalles en las últimas horas. Más información en la bio.`
  ],
  debate: [
    (b, n) => `¿Sobrevalorados o leyendas absolutas? ${b}: ${n}. Queremos saber tu opinión real. ¿Vale la pena pagar lo que piden hoy por verlos en vivo?`,
    (b, n) => `Opinión impopular 🔥: ${b} ya no es lo que era. ${n}. ¿Estás de acuerdo o vas a defenderlos hasta el final? Comenta.`,
    (b, n) => `Va la pregunta incómoda: ${n}. ¿${b} sigue siendo top o vive de su nombre? Tu respuesta en comentarios 👇`
  ]
};

function cleanSub(s) {
  return s.trim().replace(/[.!\s]+$/, '');
}

const HASH_BLOCK = /\n\n(?:#\S+\s*)+$/;

function updateCharCount() {
  const text = $('captionBox').value;
  $('charCount').innerText = `${text.length} CARACTERES`;
  const clean = text.replace(HASH_BLOCK, '').replace(/\s+/g, ' ').trim();
  $('postCaptionSnippet').innerText = clean.length > 80 ? clean.slice(0, 80) + '...' : clean;
  saveState();
}

function selectTone(tone) {
  currentTone = tone;
  TONES.forEach((t) => { $('tone-' + t).className = t === tone ? TONE_ON : TONE_OFF; });
  regenerateCaption(tone);
}

function regenerateCaption(tone) {
  tone = COPY[tone] ? tone : currentTone;
  currentTone = tone;
  const band = $('inputHeadline').value.trim() || 'METALLICA';
  const news = cleanSub($('inputSubheadline').value) || 'NUEVA NOTICIA EXPLOSIVA';
  const pool = COPY[tone];
  let i = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && i === lastVariant[tone]) i = (i + 1) % pool.length;
  lastVariant[tone] = i;
  const hadTags = HASH_BLOCK.test($('captionBox').value);
  $('captionBox').value = pool[i](band, news.toLowerCase().replace(/^./, (c) => c.toUpperCase()));
  if (hadTags) insertHashtags(); else updateCharCount();
}

// ---------- Hashtags ----------
let tags = [
  { t: '#Metallica', on: true, band: true },
  { t: '#HeavyMetal', on: false },
  { t: '#ThrashMetal', on: true },
  { t: '#MetalMemesMX', on: true },
  { t: '#ConciertosMexico', on: true },
  { t: '#Headbanger', on: true },
  { t: '#MoshPit', on: true }
];

function bandTag() {
  const raw = $('inputHeadline').value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, ' ').trim();
  if (!raw) return '#Metal';
  const words = raw.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return ('#' + words.join('')).slice(0, 30);
}

function refreshBandTag() {
  const bt = tags.find((x) => x.band);
  if (bt) {
    bt.t = bandTag();
    renderTags();
  }
}

function renderTags() {
  $('hashtagContainer').innerHTML = tags.map((x, i) => {
    const cls = x.on ? 'border-red-500/30 text-red-400' : 'border-[#2B2D38] text-gray-300';
    return `<button onclick="toggleTag(${i})" class="text-[11px] font-code bg-[#1A1B20] border ${cls} px-2 py-1 rounded uppercase">${esc(x.t)}</button>`;
  }).join('');
  $('tagCount').innerText = `${tags.filter((x) => x.on).length} SELECCIONADOS`;
}

function toggleTag(i) {
  tags[i].on = !tags[i].on;
  renderTags();
  saveState();
}

function addCustomTag() {
  const inp = $('customTag');
  const word = inp.value.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '');
  if (!word) { toast('Escribe un hashtag válido'); return; }
  const t = '#' + word;
  const existing = tags.find((x) => x.t.toLowerCase() === t.toLowerCase());
  if (existing) existing.on = true; else tags.push({ t, on: true });
  inp.value = '';
  renderTags();
  saveState();
}

function selectedTagsText() {
  return tags.filter((x) => x.on).map((x) => x.t).join(' ');
}

function insertHashtags() {
  const box = $('captionBox');
  const base = box.value.replace(HASH_BLOCK, '').replace(/\s+$/, '');
  const sel = selectedTagsText();
  box.value = sel ? `${base}\n\n${sel}` : base;
  updateCharCount();
}

// ---------- Copiar ----------
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e2) {
      return false;
    }
  }
}

async function copyCaption() {
  const ok = await copyText($('captionBox').value);
  toast(ok ? '¡Caption copiado al portapapeles!' : 'No se pudo copiar. Selecciona el texto y cópialo a mano.');
}

async function copyFullCaption() {
  let text = $('captionBox').value;
  if (!HASH_BLOCK.test(text) && selectedTagsText()) text += '\n\n' + selectedTagsText();
  const ok = await copyText(text);
  toast(ok ? '¡Caption completo copiado!' : 'No se pudo copiar. Selecciona el texto y cópialo a mano.');
}

// ---------- Descarga de imagen (canvas nativo) ----------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('img'));
    img.src = src;
  });
}

function wrapLines(ctx, text, maxW) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else { line = test; }
  });
  if (line) lines.push(line);
  return lines;
}

// Ajusta el tamaño de fuente hasta que el texto quepa en maxLines
function fitText(ctx, text, fontTpl, size, maxW, maxLines) {
  let s = size;
  let lines;
  for (;;) {
    ctx.font = fontTpl.replace('{s}', s);
    lines = wrapLines(ctx, text, maxW);
    if (lines.length <= maxLines || s <= size * 0.4) break;
    s -= 2;
  }
  return { size: s, lines };
}

const YT_PATH = 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z';

async function renderMeme() {
  const { w: W, h: H } = RATIOS[currentRatio];
  const k = W / 340; // escala respecto a la vista previa
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const FONT = 'Anton, Impact, "Arial Narrow", sans-serif';
  try { await Promise.all([document.fonts.load('40px Anton'), document.fonts.load('bold 20px Inter'), document.fonts.load('bold 20px "JetBrains Mono"')]); } catch (e) { /* fuentes no disponibles */ }

  ctx.fillStyle = '#171717';
  ctx.fillRect(0, 0, W, H);

  // Fondo: recorte tipo "cover", escala de grises y contraste
  let imgOk = true;
  try {
    const img = await loadImage(currentImage);
    const s = Math.max(W / img.width, H / img.height);
    const dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const data = ctx.getImageData(0, 0, W, H);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      g = ((g - 128) * 1.25 + 128) * 0.9;
      d[i] = d[i + 1] = d[i + 2] = g < 0 ? 0 : g > 255 ? 255 : g;
    }
    ctx.putImageData(data, 0, 0);
  } catch (e) {
    imgOk = false;
  }

  // Degradado inferior
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.35, 'rgba(0,0,0,0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const pad = 16 * k;
  const maxW = W - pad * 2;

  // Etiqueta superior
  ctx.font = `bold ${9 * k}px "JetBrains Mono", monospace`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${1.5 * k}px`;
  const tagText = 'NOTICIA EXCLUSIVA';
  const tw = ctx.measureText(tagText).width;
  const tx = 12 * k, ty = 12 * k, th = 20 * k, tpad = 8 * k;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath(); ctx.roundRect(tx, ty, tw + tpad * 2, th, 4 * k); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = k; ctx.stroke();
  ctx.fillStyle = '#D1D5DB'; ctx.textBaseline = 'middle';
  ctx.fillText(tagText, tx + tpad, ty + th / 2 + k * 0.5);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Cintillo inferior
  const footH = 38 * k;
  ctx.fillStyle = '#FF2A44';
  ctx.fillRect(0, H - footH, W, footH);
  ctx.fillStyle = 'rgba(248,113,113,0.4)';
  ctx.fillRect(0, H - footH, W, k);
  const iconS = 16 * k, gap = 8 * k;
  let fs = 11 * k;
  const footText = 'SIGUE NUESTRO CANAL DE YOUTUBE: METAL MEMES MX';
  const setFoot = () => { ctx.font = `italic 800 ${fs}px Inter, Arial, sans-serif`; };
  setFoot();
  while (ctx.measureText(footText).width + gap + iconS > W - pad * 1.5 && fs > 6 * k) { fs -= 0.5; setFoot(); }
  const ftw = ctx.measureText(footText).width;
  const fx = (W - (ftw + gap + iconS)) / 2;
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
  ctx.fillText(footText, fx, H - footH / 2);
  ctx.save();
  ctx.translate(fx + ftw + gap, H - footH / 2 - iconS / 2);
  ctx.scale(iconS / 24, iconS / 24);
  ctx.fill(new Path2D(YT_PATH));
  ctx.restore();

  // Textos
  const headline = $('inputHeadline').value.trim().toUpperCase() || 'METALLICA';
  const sub = $('inputSubheadline').value.trim().toUpperCase();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${0.04 * k * 20}px`;

  let y = H - footH - 12 * k;
  if (sub) {
    const f = fitText(ctx, sub, `italic {s}px ${FONT}`, 20 * k, maxW, 5);
    ctx.font = `italic ${f.size}px ${FONT}`;
    ctx.fillStyle = '#FF2A44';
    ctx.shadowBlur = 8 * k;
    const lh = f.size * 1.15;
    for (let i = f.lines.length - 1; i >= 0; i--) { ctx.fillText(f.lines[i], pad, y); y -= lh; }
    y -= 4 * k;
  }
  {
    const f = fitText(ctx, headline, `{s}px ${FONT}`, 36 * k, maxW, 3);
    ctx.font = `${f.size}px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10 * k;
    const lh = f.size * 1.05;
    for (let i = f.lines.length - 1; i >= 0; i--) { ctx.fillText(f.lines[i], pad, y); y -= lh; }
  }
  ctx.shadowBlur = 0;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  return { canvas: c, imgOk };
}

async function downloadImage() {
  const btn = $('downloadBtn');
  btn.disabled = true;
  try {
    const { canvas, imgOk } = await renderMeme();
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error('blob');
    const slug = ($('inputHeadline').value || 'meme').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meme';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `metal-memes-${slug}-${currentRatio.replace(':', 'x')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(imgOk ? '¡Imagen descargada!' : 'Descargada sin fondo: la URL de la imagen no permite exportación. Usa "SUBIR".');
  } catch (e) {
    toast('No se pudo generar la imagen.');
  } finally {
    btn.disabled = false;
  }
}

// ---------- Inicio ----------
function init() {
  // Los listeners se registran aquí (no inline) para no depender del orden de carga
  ['bgImage', 'postPreviewImg'].forEach((id) => {
    const img = $(id);
    img.addEventListener('error', () => imgFallback(img));
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) imgFallback(img);
  });
  const st = loadState();
  if (st.processed) st.processed.forEach((id) => processed.add(id));
  if (Array.isArray(st.tags) && st.tags.length) tags = st.tags;
  if (st.headline) $('inputHeadline').value = st.headline;
  if (st.sub) $('inputSubheadline').value = st.sub;
  if (st.img) { imageSetByUser = true; setImageSrc(st.img); }
  $('previewHeadline').innerText = $('inputHeadline').value.toUpperCase();
  $('postHeadline').innerText = $('inputHeadline').value.toUpperCase();
  $('previewSubheadline').innerText = $('inputSubheadline').value.toUpperCase();
  $('postSubheadline').innerText = $('inputSubheadline').value.toUpperCase();
  refreshBandTag();
  renderTags();
  renderGenres();
  renderNews();
  setRatio(RATIOS[st.ratio] ? st.ratio : '3:4');
  currentTone = COPY[st.tone] ? st.tone : 'metalero';
  TONES.forEach((t) => { $('tone-' + t).className = t === currentTone ? TONE_ON : TONE_OFF; });
  if (st.caption) { $('captionBox').value = st.caption; updateCharCount(); } else { regenerateCaption(currentTone); }
}

init();

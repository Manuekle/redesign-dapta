// Builds public/icons/hugeicons.svg: blindem's sprite (icons-src/blindem.svg, unchanged) plus the extra symbols the
// Dapta screens need, taken from the same package (@hugeicons/core-free-icons, Stroke Rounded). Symbols keep only
// geometry, as in blindem: stroke, width, caps and joins come from the `svg` rule in css/app.css.
import { readFileSync, writeFileSync } from 'node:fs';
import * as icons from '@hugeicons/core-free-icons';

const EXTRA = {
  phone: 'Call02Icon',
  bot: 'RoboticIcon',
  'ai-chat': 'AiChat02Icon',
  megaphone: 'Megaphone01Icon',
  workflow: 'WorkflowSquare03Icon',
  mic: 'Mic01Icon',
  paperclip: 'Attachment01Icon',
  play: 'PlayIcon',
  link: 'Link01Icon',
  message: 'Message01Icon',
  'note-edit': 'NoteEditIcon',
  contacts: 'ContactBookIcon',
  'calendar-add': 'Calendar03Icon',
  form: 'Task01Icon',
  help: 'HelpCircleIcon',
  plug: 'PlugSocketIcon',
  'task-done': 'TaskDone01Icon',
  flash: 'FlashIcon',
  video: 'Video01Icon',
  'graduation': 'Mortarboard02Icon',
  book: 'Book02Icon',
  coins: 'Coins01Icon',
  rocket: 'Rocket01Icon',
  globe: 'Globe02Icon',
};

const GEOMETRY = new Set(['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'points']);
const element = ([tag, attrs]) =>
  `<${tag}${Object.entries(attrs).filter(([key]) => GEOMETRY.has(key)).map(([key, value]) => ` ${key}="${value}"`).join('')}/>`;

const base = readFileSync(new URL('../icons-src/blindem.svg', import.meta.url), 'utf8');
// Icons given as raw paths (24×24 Stroke Rounded), for shapes picked outside the package names above.
const CUSTOM = {
  'send-plane': [
    'M8.87038 6.13264L14.7327 4.19538C18.033 3.10476 19.6831 2.55945 20.5579 3.43426C21.4327 4.30907 20.8874 5.95922 19.7968 9.25953L17.8595 15.1218C16.6236 18.8619 16.0056 20.7319 14.8796 20.9603C14.6411 21.0087 14.3955 21.0129 14.1549 20.9727C13.019 20.7832 12.3132 18.9359 10.9016 15.2413C10.6328 14.5376 10.4983 14.1858 10.2574 13.9127C10.2018 13.8497 10.1424 13.7903 10.0795 13.7348C9.80638 13.4938 9.45455 13.3594 8.75089 13.0906C5.05627 11.679 3.20896 10.9732 3.01945 9.83727C2.97931 9.59669 2.98353 9.35108 3.03189 9.11259C3.26025 7.98657 5.13029 7.36859 8.87038 6.13264Z',
    'M12.8008 11.1865L15.498 8.48926',
  ],
};

const symbols = Object.entries(EXTRA).map(([id, name]) => {
  if (!icons[name]) throw new Error(`Unknown Hugeicon: ${name}`);
  if (base.includes(`<symbol id="${id}"`)) throw new Error(`Symbol already in blindem sprite: ${id}`);
  return `<symbol id="${id}" viewBox="0 0 24 24"><!-- ${name} -->${icons[name].map(element).join('')}</symbol>`;
});

for (const [id, paths] of Object.entries(CUSTOM)) {
  symbols.push(`<symbol id="${id}" viewBox="0 0 24 24"><!-- custom -->${paths.map(d => `<path d="${d}"/>`).join('')}</symbol>`);
}

// Dapta logo (icons-src/dapta-*.svg, the files the brand ships): the letterforms become currentColor so the mark follows
// the theme; the lime parallelograms keep the brand lime. The source draws the lime over a clipped copy of the
// silhouette, so its first path (silhouette) and its lime path are all that is needed.
const BRAND_LIME = '#cbe84f';
const logo = (id, file) => {
  const source = readFileSync(new URL(`../icons-src/${file}`, import.meta.url), 'utf8');
  const viewBox = source.match(/viewBox="([^"]+)"/)?.[1];
  const body = source.split('</defs>')[1] ?? '';
  const paths = [...body.matchAll(/<path d="([^"]+)"[^>]*fill="(#[0-9a-f]{6})"/gi)];
  const shape = paths.find(([, , fill]) => fill.toLowerCase() !== '#cbe84f' && fill.toLowerCase() !== '#d1e852');
  const accent = paths.find(([, , fill]) => fill.toLowerCase() === '#cbe84f' || fill.toLowerCase() === '#d1e852');
  if (!viewBox || !shape || !accent) throw new Error(`Unexpected logo file: ${file}`);
  return {
    symbol: `<symbol id="${id}" viewBox="${viewBox}"><!-- ${file} --><path d="${shape[1]}" fill="currentColor" fill-rule="evenodd" stroke="none"/><path d="${accent[1]}" fill="${BRAND_LIME}" fill-rule="evenodd" stroke="none"/></symbol>`,
    viewBox, shape: shape[1], accent: accent[1],
  };
};
const wordmark = logo('dapta-wordmark', 'dapta-wordmark.svg');
const iso = logo('dapta-iso', 'dapta-iso.svg');
symbols.push(wordmark.symbol, iso.symbol);

// Favicon: the isotype on the dark page color, so it reads on light and dark browser chrome.
const [x, y, w, h] = iso.viewBox.split(/\s+/).map(Number);
const pad = 70, side = Math.max(w, h) + pad * 2;
writeFileSync(new URL('../public/favicon.svg', import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x - pad - (side - w - pad * 2) / 2} ${y - pad - (side - h - pad * 2) / 2} ${side} ${side}"><rect x="${x - pad - (side - w - pad * 2) / 2}" y="${y - pad - (side - h - pad * 2) / 2}" width="${side}" height="${side}" rx="${side * 0.22}" fill="#121211"/><path d="${iso.shape}" fill="#efefef" fill-rule="evenodd"/><path d="${iso.accent}" fill="${BRAND_LIME}" fill-rule="evenodd"/></svg>\n`);

const out = base.replace('</defs>', `<!-- Dapta additions (scripts/build-icons.mjs) -->\n${symbols.join('\n')}\n</defs>`);
if (out === base) throw new Error('No </defs> in base sprite');
writeFileSync(new URL('../public/icons/hugeicons.svg', import.meta.url), out);
console.log(`hugeicons.svg: ${Object.keys(EXTRA).length} extra icons + Dapta logo; favicon.svg`);

// Genera imágenes SVG de muestra (monedas y billetes) para artículos sin foto.
import { nombrePais } from './data/countries.js';

const METAL_COLORES = {
  Oro: ['#f7e09a', '#c99a2e', '#7a5a12'],
  Plata: ['#fbfbfb', '#c3c7cc', '#6d737a'],
  Cobre: ['#f3b38e', '#b8653a', '#5e2b12'],
  Bronce: ['#e9bb85', '#a8743c', '#55351a'],
  Latón: ['#f4e2a0', '#c2a046', '#6b5419'],
  Níquel: ['#f1f2f3', '#b4b9be', '#5f656b'],
  Cuproníquel: ['#eff0f1', '#adb3b8', '#5a6066'],
  Alpaca: ['#eef0ee', '#b0b6b0', '#5d635d'],
  Aluminio: ['#fafbfc', '#ccd1d6', '#7c838a'],
  Acero: ['#e8eaec', '#a3aab0', '#50565c'],
  Zinc: ['#dfe2e4', '#9aa1a7', '#4c5258'],
};

function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function hash(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function aDataUri(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function hojas(cx, cy, radio, desde, hasta, color) {
  let s = '';
  const pasos = 9;
  for (let i = 0; i <= pasos; i++) {
    const a = ((desde + ((hasta - desde) * i) / pasos) * Math.PI) / 180;
    const x = cx + radio * Math.cos(a);
    const y = cy + radio * Math.sin(a);
    const rot = (a * 180) / Math.PI + 90;
    s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7" ry="15" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${color}" opacity=".55"/>`;
  }
  return s;
}

function moneda(item, lado) {
  const id = escapar(item.id);
  const bimetalica = item.metal === 'Bimetálica';
  const [claro, medio, oscuro] = METAL_COLORES[bimetalica ? 'Latón' : item.metal] || METAL_COLORES.Níquel;
  const [cClaro, cMedio] = METAL_COLORES.Níquel;
  const pais = escapar(nombrePais(item.pais).toUpperCase());
  const denom = escapar(item.denominacion || '');
  const anio = escapar(item.anio || '');
  const tamDenom = denom.length > 10 ? 34 : denom.length > 6 ? 44 : 58;

  const centro = bimetalica
    ? `<circle cx="200" cy="200" r="118" fill="url(#c-${id})" stroke="${oscuro}" stroke-opacity=".5" stroke-width="2"/>`
    : '';

  const anverso = `
    <text x="200" y="${200 + tamDenom * 0.15}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${tamDenom}" fill="${oscuro}" fill-opacity=".85">${denom}</text>
    <text x="200" y="292" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="${oscuro}" fill-opacity=".75">${anio}</text>
    <text font-family="Georgia, serif" font-size="22" letter-spacing="3" fill="${oscuro}" fill-opacity=".8"><textPath href="#arco-${id}" startOffset="50%" text-anchor="middle">${pais}</textPath></text>`;

  const reverso = `
    ${hojas(200, 200, 128, 100, 260, oscuro)}
    ${hojas(200, 200, 128, 80, -80, oscuro)}
    <path d="M200 140 l14 30 32 4 -24 22 7 32 -29 -16 -29 16 7 -32 -24 -22 32 -4z" fill="${oscuro}" fill-opacity=".55"/>
    <text x="200" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="2" fill="${oscuro}" fill-opacity=".7">${escapar((item.metal || '').toUpperCase())}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <radialGradient id="g-${id}" cx="35%" cy="30%" r="80%">
        <stop offset="0" stop-color="${claro}"/><stop offset=".6" stop-color="${medio}"/><stop offset="1" stop-color="${oscuro}"/>
      </radialGradient>
      <radialGradient id="c-${id}" cx="35%" cy="30%" r="80%">
        <stop offset="0" stop-color="${cClaro}"/><stop offset="1" stop-color="${cMedio}"/>
      </radialGradient>
      <path id="arco-${id}" d="M 70 200 A 130 130 0 0 1 330 200"/>
    </defs>
    <circle cx="200" cy="200" r="192" fill="url(#g-${id})"/>
    <circle cx="200" cy="200" r="178" fill="none" stroke="${oscuro}" stroke-opacity=".45" stroke-width="3"/>
    <circle cx="200" cy="200" r="168" fill="none" stroke="${oscuro}" stroke-opacity=".35" stroke-width="5" stroke-dasharray="2 7"/>
    ${centro}
    ${lado === 'reverso' ? reverso : anverso}
  </svg>`;
}

function billete(item, lado) {
  const h = hash(item.id + (item.pais || ''));
  const tono = h % 360;
  const fondo = `hsl(${tono} 38% 86%)`;
  const tinta = `hsl(${tono} 45% 28%)`;
  const acento = `hsl(${(tono + 40) % 360} 40% 60%)`;
  const pais = escapar(nombrePais(item.pais).toUpperCase());
  const denom = escapar(item.denominacion || '');
  // El número de la esquina (sin la moneda); si es muy largo se omite.
  const numeroEsquina = String(item.denominacion || '').replace(/\s*[^\d\s.,]+.*$/, '').trim();
  const valor = escapar(numeroEsquina.length <= 7 ? numeroEsquina : '');
  const anio = escapar(item.anio || '');

  let ondas = '';
  for (let i = 0; i < 14; i++) {
    const y = 60 + i * 15;
    const amp = 8 + (i % 4) * 3;
    ondas += `<path d="M20 ${y} Q 110 ${y - amp} 200 ${y} T 380 ${y} T 560 ${y} T 740 ${y}" fill="none" stroke="${acento}" stroke-opacity=".35" stroke-width="1.2"/>`;
  }

  const anverso = `
    <ellipse cx="470" cy="165" rx="82" ry="98" fill="${tinta}" fill-opacity=".12" stroke="${tinta}" stroke-opacity=".4" stroke-width="2"/>
    <circle cx="470" cy="140" r="30" fill="${tinta}" fill-opacity=".25"/>
    <path d="M415 230 q55 -70 110 0 z" fill="${tinta}" fill-opacity=".25"/>
    <text x="40" y="70" font-family="Georgia, serif" font-size="24" letter-spacing="3" fill="${tinta}">${pais}</text>
    <text x="40" y="190" font-family="Georgia, serif" font-weight="700" font-size="${denom.length > 16 ? 22 : 40}" fill="${tinta}">${denom}</text>
    <text x="40" y="270" font-family="Georgia, serif" font-size="20" fill="${tinta}" fill-opacity=".8">${anio}</text>`;

  const reverso = `
    <path d="M40 250 L140 150 L210 210 L300 110 L420 230 L500 170 L600 250 Z" fill="${tinta}" fill-opacity=".18"/>
    <circle cx="520" cy="90" r="26" fill="${acento}" fill-opacity=".5"/>
    <text x="320" y="292" text-anchor="middle" font-family="Georgia, serif" font-size="18" letter-spacing="4" fill="${tinta}" fill-opacity=".8">${pais}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320">
    <rect width="640" height="320" rx="10" fill="${fondo}"/>
    ${ondas}
    <rect x="12" y="12" width="616" height="296" rx="6" fill="none" stroke="${tinta}" stroke-opacity=".55" stroke-width="3"/>
    <rect x="20" y="20" width="600" height="280" rx="4" fill="none" stroke="${tinta}" stroke-opacity=".3" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="596" y="62" text-anchor="end" font-family="Georgia, serif" font-weight="700" font-size="36" fill="${tinta}">${valor}</text>
    <text x="596" y="288" text-anchor="end" font-family="Georgia, serif" font-weight="700" font-size="28" fill="${tinta}" fill-opacity=".7">${valor}</text>
    ${lado === 'reverso' ? reverso : anverso}
  </svg>`;
}

const cache = new Map();

/** Devuelve una imagen (data URI) de muestra para el artículo y lado indicados. */
export function imagenMuestra(item, lado = 'anverso') {
  const clave = `${item.id}|${lado}|${item.tipo}|${item.metal}|${item.denominacion}|${item.anio}|${item.pais}`;
  if (!cache.has(clave)) {
    cache.set(clave, aDataUri(item.tipo === 'billete' ? billete(item, lado) : moneda(item, lado)));
  }
  return cache.get(clave);
}

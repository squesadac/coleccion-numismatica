// Mapa mundial: cada país se colorea según cuántas piezas hay de él.
import { listarItems } from '../data/store.js';
import { PAIS_POR_CODIGO, CODIGO_POR_NUMERICO, nombrePais, compararTexto } from '../data/countries.js';
import { html, numero, vacio } from '../ui.js';

const D3_GEO = 'https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/+esm';
const TOPOJSON = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm';
const MUNDO = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';

let mundoCache = null;
async function cargarMundo() {
  if (!mundoCache) {
    mundoCache = Promise.all([import(D3_GEO), import(TOPOJSON), fetch(MUNDO).then((r) => {
      if (!r.ok) throw new Error('No se pudo descargar el mapa.');
      return r.json();
    })]).catch((e) => {
      mundoCache = null;
      throw e;
    });
  }
  return mundoCache;
}

const UMBRALES = [1, 3, 10, 30, 100];
function nivel(cantidad) {
  let n = 0;
  UMBRALES.forEach((u, i) => {
    if (cantidad >= u) n = i + 1;
  });
  return n;
}

export async function render(principal) {
  const items = await listarItems();

  // Piezas por país emisor y por país del mapa (las entidades históricas se suman a su país actual).
  const porEmisor = new Map();
  const porMapa = new Map();
  for (const i of items) {
    porEmisor.set(i.pais, (porEmisor.get(i.pais) || 0) + 1);
    const destino = PAIS_POR_CODIGO.get(i.pais)?.mapa;
    if (destino) porMapa.set(destino, (porMapa.get(destino) || 0) + 1);
  }

  const emisores = [...porEmisor.entries()].sort((a, b) => b[1] - a[1] || compararTexto(nombrePais(a[0]), nombrePais(b[0])));

  principal.innerHTML = String(html`
    <section class="contenedor seccion">
      <div class="seccion-titulo">
        <div>
          <h1>Mapa de la colección</h1>
          <p class="bajada">Piezas de ${numero.format(porEmisor.size)} países y territorios. Toque un país para ver sus piezas.</p>
        </div>
      </div>

      <div class="mapa-marco">
        <div class="mapa" id="mapa"><p class="cargando">Cargando mapa…</p></div>
        <div class="mapa-tooltip" id="tooltip" hidden></div>
        <div class="mapa-leyenda" aria-hidden="true">
          <span>Menos</span>
          ${UMBRALES.map((u, i) => html`<i class="n${i + 1}" title="${u}+"></i>`)}
          <span>Más</span>
        </div>
      </div>

      ${emisores.length
        ? html`<div class="seccion">
            <h2>Todos los países</h2>
            <ul class="lista-paises">
              ${emisores.map(([codigo, cantidad]) => html`
                <li><a href="#/catalogo?pais=${codigo}">
                  <span>${nombrePais(codigo)}${PAIS_POR_CODIGO.get(codigo)?.historico ? html` <small>histórico</small>` : ''}</span>
                  <b>${numero.format(cantidad)}</b>
                </a></li>`)}
            </ul>
          </div>`
        : vacio('Sin piezas', 'Cuando se agreguen piezas aparecerán aquí.')}
    </section>`);

  const contenedor = principal.querySelector('#mapa');
  const tooltip = principal.querySelector('#tooltip');

  try {
    const [d3, topojson, mundo] = await cargarMundo();
    if (!contenedor.isConnected) return;
    const paises = topojson.feature(mundo, mundo.objects.countries).features.filter((f) => f.id !== '010'); // sin Antártida
    const ancho = 960;
    const coleccion = { type: 'FeatureCollection', features: paises };
    const proyeccion = d3.geoNaturalEarth1().fitWidth(ancho, coleccion);
    const camino = d3.geoPath(proyeccion);
    const alto = Math.ceil(camino.bounds(coleccion)[1][1]) + 4;

    const formas = paises
      .map((f) => {
        const codigo = CODIGO_POR_NUMERICO.get(parseInt(f.id, 10));
        const cantidad = codigo ? porMapa.get(codigo) || 0 : 0;
        const d = camino(f);
        if (!d) return '';
        return `<path d="${d}" class="pais n${nivel(cantidad)}" data-codigo="${codigo || ''}" data-cantidad="${cantidad}" data-nombre="${(codigo ? nombrePais(codigo) : f.properties?.name || '').replace(/"/g, '&quot;')}"${cantidad ? ' tabindex="0" role="link"' : ''}></path>`;
      })
      .join('');

    contenedor.innerHTML = `<svg viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Mapa mundial de la colección">${formas}</svg>`;

    const svg = contenedor.querySelector('svg');
    const marco = principal.querySelector('.mapa-marco');

    const mostrar = (e) => {
      const p = e.target.closest('.pais');
      if (!p) {
        tooltip.hidden = true;
        return;
      }
      const cantidad = Number(p.dataset.cantidad);
      tooltip.textContent = `${p.dataset.nombre}: ${cantidad ? `${numero.format(cantidad)} ${cantidad === 1 ? 'pieza' : 'piezas'}` : 'sin piezas'}`;
      tooltip.hidden = false;
      const r = marco.getBoundingClientRect();
      const x = (e.clientX ?? r.left + r.width / 2) - r.left;
      const y = (e.clientY ?? r.top + r.height / 2) - r.top;
      tooltip.style.left = `${Math.min(r.width - 10, Math.max(10, x))}px`;
      tooltip.style.top = `${Math.max(10, y - 14)}px`;
    };
    const ir = (p) => {
      if (p && Number(p.dataset.cantidad) > 0 && p.dataset.codigo) {
        // Si el país del mapa agrupa entidades históricas, el catálogo filtra por el país actual.
        location.hash = `#/catalogo?pais=${p.dataset.codigo}`;
      }
    };

    svg.addEventListener('mousemove', mostrar);
    svg.addEventListener('mouseleave', () => (tooltip.hidden = true));
    svg.addEventListener('click', (e) => ir(e.target.closest('.pais')));
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') ir(e.target.closest('.pais'));
    });
    svg.addEventListener('focusin', (e) => {
      const p = e.target.closest('.pais');
      if (p) {
        const r = p.getBoundingClientRect();
        mostrar({ target: p, clientX: r.left + r.width / 2, clientY: r.top });
      }
    });
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = '<p class="cargando">No se pudo cargar el mapa. Revise la conexión a internet. La lista de países abajo sigue disponible.</p>';
  }
}

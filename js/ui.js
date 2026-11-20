// Utilidades de interfaz compartidas por todas las vistas.
import { nombrePais } from './data/countries.js';
import { imagenMuestra } from './placeholder.js';

export function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Plantilla HTML que escapa automáticamente los valores interpolados.
 *  Use `crudo(html)` para insertar HTML ya construido. */
export function html(partes, ...valores) {
  let salida = '';
  partes.forEach((parte, i) => {
    salida += parte;
    if (i < valores.length) salida += aTexto(valores[i]);
  });
  return new HtmlSeguro(salida);
}

class HtmlSeguro {
  constructor(texto) {
    this.texto = texto;
  }
  toString() {
    return this.texto;
  }
}

export function crudo(texto) {
  return new HtmlSeguro(String(texto ?? ''));
}

function aTexto(valor) {
  if (valor instanceof HtmlSeguro) return valor.texto;
  if (Array.isArray(valor)) return valor.map(aTexto).join('');
  if (valor === null || valor === undefined || valor === false) return '';
  return esc(valor);
}

export const colones = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
export const numero = new Intl.NumberFormat('es-CR');

export function fotoDe(item, lado = 'anverso') {
  return item.fotos?.[lado] || item.fotos?.[`${lado}Mini`] || imagenMuestra(item, lado);
}

export function miniaturaDe(item, lado = 'anverso') {
  return item.fotos?.[`${lado}Mini`] || item.fotos?.[lado] || imagenMuestra(item, lado);
}

export function tituloItem(item) {
  return [item.denominacion, item.anio].filter(Boolean).join(' · ') || 'Sin título';
}

export function tarjetaItem(item) {
  return html`
    <a class="tarjeta" href="#/pieza/${item.id}">
      <div class="tarjeta-foto ${item.tipo === 'billete' ? 'es-billete' : 'es-moneda'}">
        <img src="${miniaturaDe(item)}" alt="${tituloItem(item)}" loading="lazy" decoding="async">
      </div>
      <div class="tarjeta-texto">
        <strong>${item.denominacion || 'Sin denominación'}</strong>
        <span>${nombrePais(item.pais)}${item.anio ? ` · ${item.anio}` : ''}</span>
      </div>
    </a>`;
}

export function vacio(titulo, texto, accion = '') {
  return html`
    <div class="vacio">
      <div class="vacio-icono" aria-hidden="true">◎</div>
      <h3>${titulo}</h3>
      <p>${texto}</p>
      ${accion}
    </div>`;
}

let temporizadorAviso = null;
export function aviso(mensaje, tipo = 'ok') {
  let caja = document.getElementById('aviso');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'aviso';
    caja.setAttribute('role', 'status');
    document.body.appendChild(caja);
  }
  caja.textContent = mensaje;
  caja.className = `aviso visible ${tipo}`;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => caja.classList.remove('visible'), 3200);
}

/** Lee parámetros de la parte "?a=b" de la ruta actual. */
export function parametros(consulta) {
  return Object.fromEntries(new URLSearchParams(consulta || ''));
}

export function construirRuta(base, params) {
  const limpios = Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null);
  const qs = new URLSearchParams(limpios).toString();
  return qs ? `${base}?${qs}` : base;
}

export function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Pinta una lista larga por tandas, cargando más al hacer scroll. */
export function listaPorTandas(contenedor, elementos, render, tanda = 60, ancla = contenedor) {
  let mostrados = 0;
  const centinela = document.createElement('div');
  centinela.className = 'centinela';

  const siguiente = () => {
    const parte = elementos.slice(mostrados, mostrados + tanda);
    contenedor.insertAdjacentHTML('beforeend', parte.map((e) => String(render(e))).join(''));
    mostrados += parte.length;
    if (mostrados >= elementos.length) {
      observador.disconnect();
      centinela.remove();
    }
  };

  const observador = new IntersectionObserver((entradas) => {
    if (entradas.some((e) => e.isIntersecting)) siguiente();
  }, { rootMargin: '600px' });

  contenedor.innerHTML = '';
  ancla.after(centinela);
  siguiente();
  if (mostrados < elementos.length) observador.observe(centinela);
  return () => {
    observador.disconnect();
    centinela.remove();
  };
}

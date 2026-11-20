import { CONFIG } from '../config.js';
import { listarItems, listarAlbumes } from '../data/store.js';
import { nombrePais, PAIS_POR_CODIGO } from '../data/countries.js';
import { html, numero, tarjetaItem, vacio, miniaturaDe } from '../ui.js';
import { portadaAlbum } from './albums.js';

function anioNumero(item) {
  const m = String(item.anio || '').match(/\d{3,4}/);
  return m ? parseInt(m[0], 10) : null;
}

export async function render(principal) {
  const [items, albumes] = await Promise.all([listarItems(), listarAlbumes()]);

  const monedas = items.filter((i) => i.tipo === 'moneda').length;
  const billetes = items.filter((i) => i.tipo === 'billete').length;
  const paises = new Set(items.map((i) => i.pais).filter((p) => PAIS_POR_CODIGO.has(p)));
  const conAnio = items.filter((i) => anioNumero(i) !== null);
  const masAntigua = conAnio.reduce((a, b) => (anioNumero(b) < anioNumero(a) ? b : a), conAnio[0]);
  const recientes = [...items].sort((a, b) => String(b.creado).localeCompare(String(a.creado))).slice(0, 12);
  const destacadas = items.filter((i) => i.historia).slice(0, 3);

  principal.innerHTML = String(html`
    <section class="portada">
      <div class="contenedor portada-fila">
        <div class="portada-texto">
          <p class="sobretitulo">La colección de ${CONFIG.coleccionista}</p>
          <h1>${CONFIG.subtitulo}</h1>
          <p class="portada-bajada">Un álbum digital para recorrer, pieza por pieza, una vida de coleccionismo.</p>
          <div class="botones">
            <a class="boton primario" href="#/albumes">Abrir los álbumes</a>
            <a class="boton" href="#/mapa">Ver el mapa</a>
          </div>
        </div>
        <div class="portada-monedas" aria-hidden="true">
          ${items.filter((i) => i.tipo === 'moneda').slice(0, 3).map((i, n) => html`<img class="flotante f${n}" src="${miniaturaDe(i)}" alt="">`)}
        </div>
      </div>
    </section>

    <section class="contenedor">
      <dl class="cifras">
        <div><dt>Piezas</dt><dd>${numero.format(items.length)}</dd></div>
        <div><dt>Monedas</dt><dd>${numero.format(monedas)}</dd></div>
        <div><dt>Billetes</dt><dd>${numero.format(billetes)}</dd></div>
        <div><dt>Países</dt><dd>${numero.format(paises.size)}</dd></div>
        <div><dt>La más antigua</dt><dd>${masAntigua ? anioNumero(masAntigua) : '—'}</dd>
          ${masAntigua ? html`<a class="cifra-nota" href="#/pieza/${masAntigua.id}">${nombrePais(masAntigua.pais)}</a>` : ''}</div>
      </dl>
    </section>

    ${items.length === 0
      ? html`<section class="contenedor">${vacio('La colección está vacía', 'Todavía no se han agregado piezas.', html`<a class="boton primario" href="#/admin">Agregar la primera pieza</a>`)}</section>`
      : html`
        <section class="contenedor seccion">
          <div class="seccion-titulo">
            <h2>Álbumes</h2>
            <a href="#/albumes">Ver todos →</a>
          </div>
          <div class="estante">${albumes.slice(0, 6).map((a) => portadaAlbum(a, items))}</div>
        </section>

        ${destacadas.length
          ? html`
            <section class="contenedor seccion">
              <div class="seccion-titulo"><h2>Piezas con historia</h2></div>
              <div class="historias">
                ${destacadas.map((i) => html`
                  <a class="historia" href="#/pieza/${i.id}">
                    <img src="${miniaturaDe(i)}" alt="" loading="lazy">
                    <div>
                      <strong>${i.denominacion} · ${nombrePais(i.pais)} ${i.anio}</strong>
                      <p>“${i.historia}”</p>
                    </div>
                  </a>`)}
              </div>
            </section>`
          : ''}

        <section class="contenedor seccion">
          <div class="seccion-titulo">
            <h2>Agregadas recientemente</h2>
            <a href="#/catalogo">Ver el catálogo →</a>
          </div>
          <div class="rejilla">${recientes.map(tarjetaItem)}</div>
        </section>`}
  `);
}

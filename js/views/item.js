import { obtenerItem, listarItems, obtenerAlbum, sesionActiva } from '../data/store.js';
import { nombrePais, CONTINENTES, continenteDe } from '../data/countries.js';
import { TIPOS, nombreEstado } from '../config.js';
import { html, colones, fotoDe, tituloItem, tarjetaItem, vacio, aviso } from '../ui.js';

function fila(etiqueta, valor) {
  return valor ? html`<div><dt>${etiqueta}</dt><dd>${valor}</dd></div>` : '';
}

function abrirVisor(src, alt) {
  const visor = document.createElement('div');
  visor.className = 'visor';
  visor.setAttribute('role', 'dialog');
  visor.setAttribute('aria-modal', 'true');
  visor.setAttribute('aria-label', 'Foto ampliada');
  visor.innerHTML = String(html`
    <button class="visor-cerrar" aria-label="Cerrar">×</button>
    <img src="${src}" alt="${alt}">
    <p class="visor-ayuda">Toque la foto para acercar · Esc para cerrar</p>`);
  document.body.appendChild(visor);
  document.body.classList.add('sin-scroll');
  const img = visor.querySelector('img');
  const cerrar = () => {
    visor.remove();
    document.body.classList.remove('sin-scroll');
    document.removeEventListener('keydown', teclas);
  };
  const teclas = (e) => e.key === 'Escape' && cerrar();
  document.addEventListener('keydown', teclas);
  visor.querySelector('.visor-cerrar').addEventListener('click', cerrar);
  visor.addEventListener('click', (e) => e.target === visor && cerrar());
  img.addEventListener('click', (e) => {
    const r = img.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    img.classList.toggle('ampliada');
  });
  img.addEventListener('mousemove', (e) => {
    if (!img.classList.contains('ampliada')) return;
    const r = img.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });
  visor.querySelector('.visor-cerrar').focus();
  return cerrar;
}

export async function render(principal, { params }) {
  const [id] = params;
  const item = await obtenerItem(id);
  if (!item) {
    principal.innerHTML = String(html`<section class="contenedor">${vacio('Pieza no encontrada', 'Puede que haya sido eliminada.', html`<a class="boton" href="#/catalogo">Ir al catálogo</a>`)}</section>`);
    return;
  }

  const [todos, album] = await Promise.all([listarItems(), item.albumId ? obtenerAlbum(item.albumId) : null]);

  // Anterior / siguiente dentro del mismo álbum (en orden de página y bolsillo).
  let anterior = null;
  let siguiente = null;
  if (album) {
    const delAlbum = todos
      .filter((i) => i.albumId === album.id)
      .sort((a, b) => (a.pagina || 9999) - (b.pagina || 9999) || (a.posicion || 0) - (b.posicion || 0));
    const idx = delAlbum.findIndex((i) => i.id === item.id);
    anterior = delAlbum[idx - 1] || null;
    siguiente = delAlbum[idx + 1] || null;
  }
  const mismoPais = todos.filter((i) => i.pais === item.pais && i.id !== item.id).slice(0, 6);
  const esAdmin = sesionActiva();
  const privado = item.privado || {};
  const esBillete = item.tipo === 'billete';

  principal.innerHTML = String(html`
    <section class="contenedor seccion">
      <nav class="migas">
        <a href="#/catalogo">Catálogo</a> /
        ${album ? html`<a href="#/album/${album.id}?p=${item.pagina || 1}">${album.nombre}</a> /` : ''}
        <span>${tituloItem(item)}</span>
      </nav>

      <article class="pieza">
        <div class="pieza-fotos">
          <div class="moneda-giro ${esBillete ? 'es-billete' : 'es-moneda'}" id="giro">
            <button class="cara anverso" data-lado="anverso" aria-label="Ampliar anverso">
              <img src="${fotoDe(item, 'anverso')}" alt="Anverso: ${tituloItem(item)}">
            </button>
            <button class="cara reverso" data-lado="reverso" aria-label="Ampliar reverso">
              <img src="${fotoDe(item, 'reverso')}" alt="Reverso: ${tituloItem(item)}" loading="lazy">
            </button>
          </div>
          <div class="selector-lado" role="group" aria-label="Lado">
            <button class="boton activo" data-ver="anverso" aria-pressed="true">Anverso</button>
            <button class="boton" data-ver="reverso" aria-pressed="false">Reverso</button>
          </div>
          ${item.muestra ? html`<p class="nota centro">Imagen ilustrativa (pieza de ejemplo).</p>` : ''}
        </div>

        <div class="pieza-datos">
          <p class="sobretitulo">${TIPOS[item.tipo] || 'Pieza'} · ${CONTINENTES[continenteDe(item.pais)]}</p>
          <h1>${item.denominacion || 'Sin denominación'}</h1>
          <p class="pieza-pais"><a href="#/catalogo?pais=${item.pais}">${nombrePais(item.pais)}</a>${item.anio ? html` · ${item.anio}` : ''}</p>

          <dl class="ficha">
            ${fila('Material', item.metal)}
            ${fila('Conservación', nombreEstado(item.estado))}
            ${fila('Catálogo', item.catalogo)}
            ${album ? fila('Ubicación', html`<a href="#/album/${album.id}?p=${item.pagina || 1}">${album.nombre}${item.pagina ? `, página ${item.pagina}` : ''}</a>`) : ''}
          </dl>

          ${item.descripcion ? html`<p class="pieza-descripcion">${item.descripcion}</p>` : ''}

          ${item.historia
            ? html`<blockquote class="pieza-historia"><span>La historia</span><p>${item.historia}</p></blockquote>`
            : ''}

          ${esAdmin
            ? html`<div class="privado">
                <h2>Solo para usted <small>(los visitantes no ven esto)</small></h2>
                <dl class="ficha">
                  ${fila('Precio de compra', privado.precioCompra != null && privado.precioCompra !== '' ? colones.format(privado.precioCompra) : '')}
                  ${fila('Valor estimado', privado.valorEstimado != null && privado.valorEstimado !== '' ? colones.format(privado.valorEstimado) : '')}
                  ${fila('Dónde está guardada', privado.ubicacion)}
                </dl>
                <a class="boton primario" href="#/admin/pieza/${item.id}">Editar esta pieza</a>
              </div>`
            : ''}

          <div class="botones">
            <button class="boton" id="compartir">Compartir</button>
          </div>

          ${album
            ? html`<nav class="vecinos" aria-label="Piezas del mismo álbum">
                ${anterior ? html`<a href="#/pieza/${anterior.id}">← ${tituloItem(anterior)}</a>` : html`<span></span>`}
                ${siguiente ? html`<a href="#/pieza/${siguiente.id}">${tituloItem(siguiente)} →</a>` : ''}
              </nav>`
            : ''}
        </div>
      </article>

      ${mismoPais.length
        ? html`<div class="seccion">
            <div class="seccion-titulo">
              <h2>Más de ${nombrePais(item.pais)}</h2>
              <a href="#/catalogo?pais=${item.pais}">Ver todas →</a>
            </div>
            <div class="rejilla">${mismoPais.map(tarjetaItem)}</div>
          </div>`
        : ''}
    </section>`);

  const giro = principal.querySelector('#giro');
  const botonesLado = principal.querySelectorAll('[data-ver]');
  botonesLado.forEach((b) =>
    b.addEventListener('click', () => {
      const reverso = b.dataset.ver === 'reverso';
      giro.classList.toggle('girada', reverso);
      botonesLado.forEach((x) => {
        x.classList.toggle('activo', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
    })
  );

  let cerrarVisor = null;
  principal.querySelectorAll('.cara').forEach((cara) =>
    cara.addEventListener('click', () => {
      const lado = cara.dataset.lado;
      cerrarVisor = abrirVisor(fotoDe(item, lado), `${lado === 'anverso' ? 'Anverso' : 'Reverso'}: ${tituloItem(item)}`);
    })
  );

  principal.querySelector('#compartir').addEventListener('click', async () => {
    const datos = { title: `${tituloItem(item)} · ${nombrePais(item.pais)}`, url: location.href };
    try {
      if (navigator.share) {
        await navigator.share(datos);
      } else {
        await navigator.clipboard.writeText(location.href);
        aviso('Enlace copiado. Péguelo en WhatsApp para compartirlo.');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') aviso('No se pudo compartir. Copie la dirección de la página.', 'error');
    }
  });

  const teclas = (e) => {
    if (document.querySelector('.visor') || e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowLeft' && anterior) location.hash = `#/pieza/${anterior.id}`;
    if (e.key === 'ArrowRight' && siguiente) location.hash = `#/pieza/${siguiente.id}`;
  };
  document.addEventListener('keydown', teclas);

  return () => {
    document.removeEventListener('keydown', teclas);
    if (cerrarVisor && document.querySelector('.visor')) cerrarVisor();
  };
}

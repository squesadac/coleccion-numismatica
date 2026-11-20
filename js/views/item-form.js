// Formulario para agregar o editar una pieza. Pensado para cargar muchas piezas seguidas.
import * as store from '../data/store.js';
import { PAISES, CONTINENTES, nombrePais } from '../data/countries.js';
import { TIPOS, METALES, ESTADOS } from '../config.js';
import { html, aviso, parametros, fotoDe, vacio } from '../ui.js';
import { comprimirFoto } from '../image.js';

const CLAVE_RECIENTES = 'coleccion-paises-recientes';

function paisesRecientes() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RECIENTES) || '[]');
  } catch {
    return [];
  }
}

function recordarPais(codigo) {
  try {
    const lista = [codigo, ...paisesRecientes().filter((c) => c !== codigo)].slice(0, 6);
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(lista));
  } catch {
    /* sin almacenamiento */
  }
}

function opcionesPais(seleccion) {
  const recientes = paisesRecientes().filter((c) => PAISES.some((p) => p.codigo === c));
  const grupos = Object.entries(CONTINENTES).map(([cont, nombre]) => {
    const lista = PAISES.filter((p) => p.continente === cont);
    if (!lista.length) return '';
    return html`<optgroup label="${nombre}">${lista.map(
      (p) => html`<option value="${p.codigo}" ${p.codigo === seleccion ? 'selected' : ''}>${p.nombre}</option>`
    )}</optgroup>`;
  });
  return html`
    <option value="">Elija un país…</option>
    ${recientes.length
      ? html`<optgroup label="Usados recientemente">${recientes.map(
          (c) => html`<option value="${c}" ${c === seleccion ? 'selected' : ''}>${nombrePais(c)}</option>`
        )}</optgroup>`
      : ''}
    ${grupos}`;
}

/** Primer bolsillo libre de un álbum, empezando por la página indicada. */
function lugarLibre(album, items, desdePagina = 1, excluirId = null) {
  if (!album) return { pagina: '', posicion: '' };
  const capacidad = album.filas * album.columnas;
  const ocupados = new Set(
    items.filter((i) => i.albumId === album.id && i.id !== excluirId && i.pagina && i.posicion).map((i) => `${i.pagina}-${i.posicion}`)
  );
  for (let p = Math.max(1, desdePagina); p < 2000; p++) {
    for (let pos = 1; pos <= capacidad; pos++) {
      if (!ocupados.has(`${p}-${pos}`)) return { pagina: p, posicion: pos };
    }
  }
  return { pagina: '', posicion: '' };
}

function zonaFoto(lado, etiqueta, src) {
  return html`
    <div class="zona-foto" data-lado="${lado}">
      <span class="zona-titulo">${etiqueta}</span>
      <label class="zona-caja ${src ? 'con-foto' : ''}">
        <input type="file" accept="image/*" data-foto="${lado}">
        <img alt="" ${src ? html`src="${src}"` : 'hidden'}>
        <span class="zona-ayuda" ${src ? 'hidden' : ''}>📷<br>Tomar o elegir foto</span>
      </label>
      <button type="button" class="boton enlace chico" data-quitar="${lado}" ${src ? '' : 'hidden'}>Quitar foto</button>
    </div>`;
}

export async function render(principal, { params, consulta }) {
  const [id] = params;
  const esNueva = id === 'nueva';
  const [items, albumes] = await Promise.all([store.listarItems(), store.listarAlbumes()]);
  const pista = parametros(consulta);

  let item;
  if (esNueva) {
    const album = albumes.find((a) => a.id === pista.album);
    const libre = lugarLibre(album, items, parseInt(pista.pagina, 10) || 1);
    item = {
      tipo: pista.tipo || 'moneda',
      pais: pista.pais || '',
      albumId: album ? album.id : '',
      pagina: libre.pagina,
      posicion: libre.posicion,
      fotos: {},
      privado: {},
    };
  } else {
    item = await store.obtenerItem(id);
    if (!item) {
      principal.innerHTML = String(html`<section class="contenedor">${vacio('Pieza no encontrada', '', html`<a class="boton" href="#/admin">Volver</a>`)}</section>`);
      return;
    }
  }
  const privado = item.privado || {};
  const fotosExistentes = { ...(item.fotos || {}) };
  const fotoInicial = (lado) => (fotosExistentes[lado] ? fotoDe(item, lado) : '');

  principal.innerHTML = String(html`
    <section class="contenedor seccion angosto">
      <nav class="migas"><a href="#/admin">Administrar</a> / <span>${esNueva ? 'Nueva pieza' : 'Editar pieza'}</span></nav>
      <h1>${esNueva ? 'Agregar pieza' : 'Editar pieza'}</h1>

      <form class="formulario" id="formulario" novalidate>
        <fieldset>
          <legend>Fotos</legend>
          <div class="fotos-par">
            ${zonaFoto('anverso', 'Anverso (frente)', fotoInicial('anverso'))}
            ${zonaFoto('reverso', 'Reverso (atrás)', fotoInicial('reverso'))}
          </div>
          <p class="nota">Consejo: fotografíe sobre un fondo liso y con buena luz, sin flash.</p>
        </fieldset>

        <fieldset>
          <legend>Datos principales</legend>
          <div class="interruptor" role="radiogroup" aria-label="Tipo">
            ${Object.entries(TIPOS).map(([v, t]) => html`
              <label><input type="radio" name="tipo" value="${v}" ${item.tipo === v ? 'checked' : ''}><span>${t}</span></label>`)}
          </div>
          <label>País o entidad emisora *
            <select name="pais" required>${opcionesPais(item.pais)}</select>
          </label>
          <div class="dos-columnas">
            <label>Denominación *<input name="denominacion" value="${item.denominacion || ''}" placeholder="Ej.: 2 colones" required></label>
            <label>Año<input name="anio" value="${item.anio || ''}" placeholder="Ej.: 1948" inputmode="numeric"></label>
          </div>
          <div class="dos-columnas">
            <label>Material
              <select name="metal">
                <option value="">—</option>
                ${METALES.map((m) => html`<option ${item.metal === m ? 'selected' : ''}>${m}</option>`)}
              </select>
            </label>
            <label>Conservación
              <select name="estado">
                <option value="">—</option>
                ${ESTADOS.map((e) => html`<option value="${e.codigo}" ${item.estado === e.codigo ? 'selected' : ''}>${e.nombre}</option>`)}
              </select>
            </label>
          </div>
          <label>Número de catálogo <small>(KM#, Pick, Numista…)</small><input name="catalogo" value="${item.catalogo || ''}" placeholder="Ej.: KM# 185"></label>
        </fieldset>

        <fieldset>
          <legend>Ubicación en el álbum</legend>
          <label>Álbum
            <select name="albumId">
              <option value="">Sin álbum</option>
              ${albumes.map((a) => html`<option value="${a.id}" ${item.albumId === a.id ? 'selected' : ''}>${a.nombre}</option>`)}
            </select>
          </label>
          <div class="dos-columnas">
            <label>Página<input name="pagina" type="number" min="1" value="${item.pagina ?? ''}"></label>
            <label>Bolsillo<input name="posicion" type="number" min="1" value="${item.posicion ?? ''}"></label>
          </div>
          <p class="nota" id="nota-bolsillo"></p>
          <button type="button" class="boton chico" id="libre">Usar el siguiente bolsillo libre</button>
        </fieldset>

        <fieldset>
          <legend>Descripción e historia</legend>
          <label>Descripción<textarea name="descripcion" rows="2" placeholder="Detalles de la pieza, variantes, errores de acuñación…">${item.descripcion || ''}</textarea></label>
          <label>La historia <small>(cómo llegó a la colección)</small><textarea name="historia" rows="3" placeholder="Ej.: Me la regaló mi papá en 1975…">${item.historia || ''}</textarea></label>
        </fieldset>

        <fieldset class="privado">
          <legend>Privado <small>(solo lo ve usted)</small></legend>
          <div class="dos-columnas">
            <label>Precio de compra (₡)<input name="precioCompra" type="number" min="0" step="any" value="${privado.precioCompra ?? ''}"></label>
            <label>Valor estimado (₡)<input name="valorEstimado" type="number" min="0" step="any" value="${privado.valorEstimado ?? ''}"></label>
          </div>
          <label>Dónde está guardada<input name="ubicacion" value="${privado.ubicacion || ''}" placeholder="Ej.: Caja fuerte, carpeta azul"></label>
        </fieldset>

        <div class="barra-guardar">
          ${esNueva ? html`<button type="submit" class="boton primario grande" data-accion="otra">Guardar y agregar otra</button>` : ''}
          <button type="submit" class="boton ${esNueva ? '' : 'primario grande'}" data-accion="guardar">Guardar</button>
          <a class="boton enlace" href="${esNueva ? '#/admin' : `#/pieza/${item.id}`}">Cancelar</a>
          ${!esNueva ? html`<button type="button" class="boton peligro" id="eliminar">Eliminar</button>` : ''}
        </div>
      </form>
    </section>`);

  const formulario = principal.querySelector('#formulario');
  const campo = (nombre) => formulario.elements[nombre];
  const notaBolsillo = principal.querySelector('#nota-bolsillo');
  const fotosNuevas = {}; // lado -> { grande, mini } (Blobs)
  const fotosQuitadas = new Set();

  // ----- Fotos -----
  formulario.querySelectorAll('[data-foto]').forEach((input) => {
    input.addEventListener('change', async () => {
      const archivo = input.files[0];
      if (!archivo) return;
      const lado = input.dataset.foto;
      const zona = input.closest('.zona-foto');
      const ayuda = zona.querySelector('.zona-ayuda');
      ayuda.hidden = false;
      ayuda.textContent = 'Procesando…';
      try {
        const opciones = store.MODO === 'demo' ? { grande: 900, mini: 300, calidad: 0.72 } : {};
        const comprimida = await comprimirFoto(archivo, opciones);
        fotosNuevas[lado] = comprimida;
        fotosQuitadas.delete(lado);
        const img = zona.querySelector('img');
        if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
        img.src = URL.createObjectURL(comprimida.mini);
        img.hidden = false;
        ayuda.hidden = true;
        zona.querySelector('.zona-caja').classList.add('con-foto');
        zona.querySelector('[data-quitar]').hidden = false;
      } catch (e) {
        ayuda.innerHTML = '📷<br>Tomar o elegir foto';
        aviso(e.message, 'error');
      }
      input.value = '';
    });
  });

  formulario.querySelectorAll('[data-quitar]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const lado = boton.dataset.quitar;
      delete fotosNuevas[lado];
      fotosQuitadas.add(lado);
      const zona = boton.closest('.zona-foto');
      const img = zona.querySelector('img');
      img.hidden = true;
      img.removeAttribute('src');
      const ayuda = zona.querySelector('.zona-ayuda');
      ayuda.hidden = false;
      ayuda.innerHTML = '📷<br>Tomar o elegir foto';
      zona.querySelector('.zona-caja').classList.remove('con-foto');
      boton.hidden = true;
    });
  });

  // ----- Bolsillos -----
  function revisarBolsillo() {
    const album = albumes.find((a) => a.id === campo('albumId').value);
    const pagina = parseInt(campo('pagina').value, 10);
    const posicion = parseInt(campo('posicion').value, 10);
    notaBolsillo.textContent = '';
    notaBolsillo.classList.remove('alerta');
    if (!album) return;
    const capacidad = album.filas * album.columnas;
    if (posicion > capacidad) {
      notaBolsillo.textContent = `Este álbum tiene ${capacidad} bolsillos por página.`;
      notaBolsillo.classList.add('alerta');
      return;
    }
    const ocupante = items.find((i) => i.albumId === album.id && i.id !== item.id && i.pagina === pagina && i.posicion === posicion);
    if (ocupante) {
      notaBolsillo.textContent = `Ese bolsillo ya lo ocupa: ${ocupante.denominacion} (${nombrePais(ocupante.pais)} ${ocupante.anio}).`;
      notaBolsillo.classList.add('alerta');
    } else if (pagina && posicion) {
      notaBolsillo.textContent = `Página ${pagina}, bolsillo ${posicion} de ${capacidad}.`;
    }
  }

  const usarLibre = () => {
    const album = albumes.find((a) => a.id === campo('albumId').value);
    const libre = lugarLibre(album, items, parseInt(campo('pagina').value, 10) || 1, item.id);
    campo('pagina').value = libre.pagina;
    campo('posicion').value = libre.posicion;
    revisarBolsillo();
  };

  principal.querySelector('#libre').addEventListener('click', usarLibre);
  campo('albumId').addEventListener('change', () => {
    campo('pagina').value = '';
    usarLibre();
  });
  campo('pagina').addEventListener('input', revisarBolsillo);
  campo('posicion').addEventListener('input', revisarBolsillo);
  revisarBolsillo();

  // ----- Guardar -----
  let guardando = false;
  formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (guardando) return;
    const accion = e.submitter?.dataset.accion || 'guardar';

    if (!campo('pais').value) {
      aviso('Elija el país.', 'error');
      campo('pais').focus();
      return;
    }
    if (!campo('denominacion').value.trim()) {
      aviso('Escriba la denominación.', 'error');
      campo('denominacion').focus();
      return;
    }

    guardando = true;
    formulario.classList.add('ocupado');
    try {
      const fotos = { ...fotosExistentes };
      for (const lado of fotosQuitadas) {
        delete fotos[lado];
        delete fotos[`${lado}Mini`];
      }
      for (const [lado, blobs] of Object.entries(fotosNuevas)) {
        fotos[lado] = await store.subirFoto(blobs.grande);
        fotos[`${lado}Mini`] = await store.subirFoto(blobs.mini);
      }

      const numeroONulo = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
      const datos = {
        id: esNueva ? undefined : item.id,
        tipo: formulario.querySelector('[name=tipo]:checked')?.value || 'moneda',
        pais: campo('pais').value,
        denominacion: campo('denominacion').value.trim(),
        anio: campo('anio').value.trim(),
        metal: campo('metal').value,
        estado: campo('estado').value,
        catalogo: campo('catalogo').value.trim(),
        albumId: campo('albumId').value,
        pagina: numeroONulo(campo('pagina').value),
        posicion: numeroONulo(campo('posicion').value),
        descripcion: campo('descripcion').value.trim(),
        historia: campo('historia').value.trim(),
        fotos,
        muestra: false,
        privado: {
          precioCompra: numeroONulo(campo('precioCompra').value),
          valorEstimado: numeroONulo(campo('valorEstimado').value),
          ubicacion: campo('ubicacion').value.trim(),
        },
      };
      if (!datos.albumId) {
        datos.pagina = null;
        datos.posicion = null;
      }

      const guardado = await store.guardarItem(datos);
      recordarPais(datos.pais);

      if (accion === 'otra') {
        aviso(`Guardada: ${guardado.denominacion}. Siga con la siguiente.`);
        const siguiente = new URLSearchParams({ tipo: datos.tipo, pais: datos.pais, album: datos.albumId || '', pagina: datos.pagina || '' }).toString();
        history.replaceState(null, '', `#/admin/pieza/nueva?${siguiente}`);
        window.scrollTo(0, 0);
        await render(principal, { params: ['nueva'], consulta: siguiente });
        principal.querySelector('#formulario [name=denominacion]')?.focus();
      } else {
        aviso('Cambios guardados.');
        location.hash = `#/pieza/${guardado.id}`;
      }
    } catch (err) {
      console.error(err);
      aviso(err.message || 'No se pudo guardar.', 'error');
    } finally {
      guardando = false;
      formulario.classList.remove('ocupado');
    }
  });

  principal.querySelector('#eliminar')?.addEventListener('click', async () => {
    if (!confirm(`¿Eliminar "${item.denominacion}" de la colección? Esto no se puede deshacer.`)) return;
    await store.eliminarItem(item.id);
    aviso('Pieza eliminada.');
    location.hash = '#/admin';
  });
}

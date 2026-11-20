import * as store from '../data/store.js';
import { html, aviso, vacio } from '../ui.js';

const COLORES = ['#1f4d3a', '#7a2e2e', '#24395e', '#5b4421', '#3d2a52', '#2c4a4f', '#1a1a1a', '#8a5a1c'];

export async function render(principal, { params }) {
  const [id] = params;
  const esNuevo = id === 'nuevo';
  const album = esNuevo
    ? { nombre: '', descripcion: '', tipo: 'moneda', filas: 4, columnas: 5, paginas: 1, color: COLORES[0] }
    : await store.obtenerAlbum(id);
  if (!album) {
    principal.innerHTML = String(html`<section class="contenedor">${vacio('Álbum no encontrado', '', html`<a class="boton" href="#/admin">Volver</a>`)}</section>`);
    return;
  }
  const cantidad = esNuevo ? 0 : (await store.listarItems()).filter((i) => i.albumId === album.id).length;

  principal.innerHTML = String(html`
    <section class="contenedor seccion angosto">
      <nav class="migas"><a href="#/admin">Administrar</a> / <span>${esNuevo ? 'Nuevo álbum' : album.nombre}</span></nav>
      <h1>${esNuevo ? 'Nuevo álbum' : 'Editar álbum'}</h1>
      <form class="formulario" id="formulario">
        <fieldset>
          <label>Nombre *<input name="nombre" value="${album.nombre}" required placeholder="Ej.: Carpeta verde · Centroamérica"></label>
          <label>Descripción<textarea name="descripcion" rows="2">${album.descripcion || ''}</textarea></label>
          <div class="interruptor" role="radiogroup" aria-label="Contenido">
            <label><input type="radio" name="tipo" value="moneda" ${album.tipo !== 'billete' ? 'checked' : ''}><span>Monedas</span></label>
            <label><input type="radio" name="tipo" value="billete" ${album.tipo === 'billete' ? 'checked' : ''}><span>Billetes</span></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Formato de cada página</legend>
          <p class="nota">Copie el formato de la carpeta física: cuántas filas y columnas de bolsillos tiene cada hoja.</p>
          <div class="tres-columnas">
            <label>Filas<input name="filas" type="number" min="1" max="12" value="${album.filas}" required></label>
            <label>Columnas<input name="columnas" type="number" min="1" max="8" value="${album.columnas}" required></label>
            <label>Páginas<input name="paginas" type="number" min="1" max="500" value="${album.paginas || 1}"></label>
          </div>
          <div class="vista-previa-hoja" id="vista-previa" aria-hidden="true"></div>
        </fieldset>
        <fieldset>
          <legend>Color de la tapa</legend>
          <div class="colores">
            ${COLORES.map((c) => html`<label style="--c:${c}"><input type="radio" name="color" value="${c}" ${album.color === c ? 'checked' : ''}><span class="sr">${c}</span></label>`)}
          </div>
        </fieldset>
        <div class="barra-guardar">
          <button class="boton primario grande">Guardar</button>
          <a class="boton enlace" href="${esNuevo ? '#/admin' : `#/album/${album.id}`}">Cancelar</a>
          ${!esNuevo ? html`<button type="button" class="boton peligro" id="eliminar">Eliminar álbum</button>` : ''}
        </div>
      </form>
    </section>`);

  const formulario = principal.querySelector('#formulario');
  const vista = principal.querySelector('#vista-previa');

  const pintarVista = () => {
    const filas = Math.min(12, Math.max(1, parseInt(formulario.elements.filas.value, 10) || 1));
    const columnas = Math.min(8, Math.max(1, parseInt(formulario.elements.columnas.value, 10) || 1));
    vista.style.setProperty('--columnas', columnas);
    vista.innerHTML = '<i></i>'.repeat(filas * columnas);
  };
  formulario.addEventListener('input', pintarVista);
  pintarVista();

  formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = formulario.elements;
    if (!f.nombre.value.trim()) {
      aviso('Escriba un nombre para el álbum.', 'error');
      return;
    }
    try {
      const guardado = await store.guardarAlbum({
        id: esNuevo ? undefined : album.id,
        nombre: f.nombre.value.trim(),
        descripcion: f.descripcion.value.trim(),
        tipo: formulario.querySelector('[name=tipo]:checked').value,
        filas: Math.min(12, Math.max(1, parseInt(f.filas.value, 10) || 1)),
        columnas: Math.min(8, Math.max(1, parseInt(f.columnas.value, 10) || 1)),
        paginas: Math.max(1, parseInt(f.paginas.value, 10) || 1),
        color: formulario.querySelector('[name=color]:checked')?.value || COLORES[0],
      });
      aviso('Álbum guardado.');
      location.hash = `#/album/${guardado.id}`;
    } catch (err) {
      aviso(err.message, 'error');
    }
  });

  principal.querySelector('#eliminar')?.addEventListener('click', async () => {
    const mensaje = cantidad
      ? `El álbum tiene ${cantidad} piezas. Las piezas NO se borran: quedarán "sin álbum". ¿Eliminar el álbum?`
      : '¿Eliminar este álbum?';
    if (!confirm(mensaje)) return;
    await store.eliminarAlbum(album.id);
    aviso('Álbum eliminado.');
    location.hash = '#/albumes';
  });
}

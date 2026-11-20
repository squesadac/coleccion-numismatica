import { iniciarSesion, MODO } from '../data/store.js';
import { html, aviso } from '../ui.js';

export async function render(principal) {
  principal.innerHTML = String(html`
    <section class="contenedor seccion angosto">
      <div class="tarjeta-panel">
        <h1>Entrar para administrar</h1>
        ${MODO === 'demo'
          ? html`<p>Está en <strong>modo de prueba</strong>: no hace falta contraseña y los cambios se guardan solo en este navegador.</p>
              <button class="boton primario grande" id="entrar">Entrar en modo de prueba</button>`
          : html`<form id="formulario" class="formulario">
              <label>Correo<input type="email" name="correo" required autocomplete="username"></label>
              <label>Contraseña<input type="password" name="clave" required autocomplete="current-password"></label>
              <button class="boton primario grande">Entrar</button>
            </form>`}
      </div>
    </section>`);

  const entrar = async (credenciales) => {
    try {
      await iniciarSesion(credenciales);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (e) {
      aviso(e.message, 'error');
    }
  };

  principal.querySelector('#entrar')?.addEventListener('click', () => entrar());
  principal.querySelector('#formulario')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = new FormData(e.target);
    entrar({ correo: datos.get('correo'), clave: datos.get('clave') });
  });
}

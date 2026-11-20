// Reduce el tamaño de las fotos en el navegador antes de guardarlas.
// Así una foto de 4 MB del celular queda en ~150 KB, y la colección completa cabe en el plan gratuito.

function cargarImagen(archivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo abrir la imagen. Pruebe con una foto JPG o PNG.'));
    };
    img.src = url;
  });
}

function redimensionar(img, ladoMaximo, calidad) {
  const escala = Math.min(1, ladoMaximo / Math.max(img.naturalWidth, img.naturalHeight));
  const ancho = Math.round(img.naturalWidth * escala);
  const alto = Math.round(img.naturalHeight * escala);
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, ancho, alto);
  return new Promise((resolve, reject) => {
    const fallo = () => reject(new Error('No se pudo comprimir la foto.'));
    lienzo.toBlob(
      (blob) => {
        if (blob && blob.type === 'image/webp') return resolve(blob);
        // Algunos navegadores (Safari) no generan WebP: se usa JPEG.
        lienzo.toBlob((jpg) => (jpg ? resolve(jpg) : fallo()), 'image/jpeg', calidad);
      },
      'image/webp',
      calidad
    );
  });
}

/**
 * Devuelve { grande, mini } como Blobs WebP.
 * @param {File} archivo
 * @param {{grande?: number, mini?: number, calidad?: number}} opciones
 */
export async function comprimirFoto(archivo, opciones = {}) {
  const { grande = 1600, mini = 400, calidad = 0.82 } = opciones;
  const img = await cargarImagen(archivo);
  const [g, m] = await Promise.all([redimensionar(img, grande, calidad), redimensionar(img, mini, 0.75)]);
  return { grande: g, mini: m };
}

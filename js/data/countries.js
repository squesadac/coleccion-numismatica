// Países y entidades emisoras.
// Formato: "ALFA2 NUMERICO CONTINENTE". Los nombres en español se obtienen con Intl.DisplayNames.
// El código numérico (ISO 3166-1) se usa para pintar el mapa mundial.

export const CONTINENTES = {
  CA: 'Centroamérica y Caribe',
  NA: 'Norteamérica',
  SA: 'Sudamérica',
  EU: 'Europa',
  AF: 'África',
  AS: 'Asia',
  OC: 'Oceanía',
  XX: 'Otros',
};

const TABLA = `
AF 004 AS|AL 008 EU|DZ 012 AF|AD 020 EU|AO 024 AF|AG 028 CA|AR 032 SA|AM 051 AS|AU 036 OC|AT 040 EU
AZ 031 AS|BS 044 CA|BH 048 AS|BD 050 AS|BB 052 CA|BY 112 EU|BE 056 EU|BZ 084 CA|BJ 204 AF|BT 064 AS
BO 068 SA|BA 070 EU|BW 072 AF|BR 076 SA|BN 096 AS|BG 100 EU|BF 854 AF|BI 108 AF|CV 132 AF|KH 116 AS
CM 120 AF|CA 124 NA|CF 140 AF|TD 148 AF|CL 152 SA|CN 156 AS|CO 170 SA|KM 174 AF|CG 178 AF|CD 180 AF
CR 188 CA|CI 384 AF|HR 191 EU|CU 192 CA|CY 196 EU|CZ 203 EU|DK 208 EU|DJ 262 AF|DM 212 CA|DO 214 CA
EC 218 SA|EG 818 AF|SV 222 CA|GQ 226 AF|ER 232 AF|EE 233 EU|SZ 748 AF|ET 231 AF|FJ 242 OC|FI 246 EU
FR 250 EU|GA 266 AF|GM 270 AF|GE 268 AS|DE 276 EU|GH 288 AF|GR 300 EU|GD 308 CA|GT 320 CA|GN 324 AF
GW 624 AF|GY 328 SA|HT 332 CA|HN 340 CA|HU 348 EU|IS 352 EU|IN 356 AS|ID 360 AS|IR 364 AS|IQ 368 AS
IE 372 EU|IL 376 AS|IT 380 EU|JM 388 CA|JP 392 AS|JO 400 AS|KZ 398 AS|KE 404 AF|KI 296 OC|KP 408 AS
KR 410 AS|KW 414 AS|KG 417 AS|LA 418 AS|LV 428 EU|LB 422 AS|LS 426 AF|LR 430 AF|LY 434 AF|LI 438 EU
LT 440 EU|LU 442 EU|MG 450 AF|MW 454 AF|MY 458 AS|MV 462 AS|ML 466 AF|MT 470 EU|MH 584 OC|MR 478 AF
MU 480 AF|MX 484 NA|FM 583 OC|MD 498 EU|MC 492 EU|MN 496 AS|ME 499 EU|MA 504 AF|MZ 508 AF|MM 104 AS
NA 516 AF|NR 520 OC|NP 524 AS|NL 528 EU|NZ 554 OC|NI 558 CA|NE 562 AF|NG 566 AF|MK 807 EU|NO 578 EU
OM 512 AS|PK 586 AS|PW 585 OC|PS 275 AS|PA 591 CA|PG 598 OC|PY 600 SA|PE 604 SA|PH 608 AS|PL 616 EU
PT 620 EU|QA 634 AS|RO 642 EU|RU 643 EU|RW 646 AF|KN 659 CA|LC 662 CA|VC 670 CA|WS 882 OC|SM 674 EU
ST 678 AF|SA 682 AS|SN 686 AF|RS 688 EU|SC 690 AF|SL 694 AF|SG 702 AS|SK 703 EU|SI 705 EU|SB 090 OC
SO 706 AF|ZA 710 AF|SS 728 AF|ES 724 EU|LK 144 AS|SD 729 AF|SR 740 SA|SE 752 EU|CH 756 EU|SY 760 AS
TW 158 AS|TJ 762 AS|TZ 834 AF|TH 764 AS|TL 626 AS|TG 768 AF|TO 776 OC|TT 780 CA|TN 788 AF|TR 792 AS
TM 795 AS|TV 798 OC|UG 800 AF|UA 804 EU|AE 784 AS|GB 826 EU|US 840 NA|UY 858 SA|UZ 860 AS|VU 548 OC
VA 336 EU|VE 862 SA|VN 704 AS|YE 887 AS|ZM 894 AF|ZW 716 AF|HK 344 AS|MO 446 AS|GI 292 EU|IM 833 EU
JE 832 EU|GG 831 EU|FO 234 EU|GL 304 NA|BM 060 NA|KY 136 CA|AW 533 CA|CW 531 CA|PR 630 CA|NC 540 OC
PF 258 OC|FK 238 SA|SH 654 AF|EH 732 AF
`;

// Entidades históricas o regionales (no existen hoy como país).
// "mapa" indica a qué país actual se suma en el mapa mundial (opcional).
const HISTORICOS = [
  { codigo: 'H-SU', nombre: 'Unión Soviética (URSS)', continente: 'EU', mapa: 'RU' },
  { codigo: 'H-DD', nombre: 'Alemania Oriental (RDA)', continente: 'EU', mapa: 'DE' },
  { codigo: 'H-DR', nombre: 'Imperio Alemán', continente: 'EU', mapa: 'DE' },
  { codigo: 'H-CS', nombre: 'Checoslovaquia', continente: 'EU', mapa: 'CZ' },
  { codigo: 'H-YU', nombre: 'Yugoslavia', continente: 'EU', mapa: 'RS' },
  { codigo: 'H-AH', nombre: 'Imperio Austrohúngaro', continente: 'EU', mapa: 'AT' },
  { codigo: 'H-OT', nombre: 'Imperio Otomano', continente: 'AS', mapa: 'TR' },
  { codigo: 'H-ZR', nombre: 'Zaire', continente: 'AF', mapa: 'CD' },
  { codigo: 'H-RH', nombre: 'Rodesia', continente: 'AF', mapa: 'ZW' },
  { codigo: 'H-AN', nombre: 'Antillas Neerlandesas', continente: 'CA', mapa: 'CW' },
  { codigo: 'H-IO', nombre: 'Indias Orientales Neerlandesas', continente: 'AS', mapa: 'ID' },
  { codigo: 'H-BI', nombre: 'India Británica', continente: 'AS', mapa: 'IN' },
  { codigo: 'H-EC', nombre: 'Estados del Caribe Oriental', continente: 'CA' },
  { codigo: 'H-AO', nombre: 'África Occidental (BCEAO)', continente: 'AF' },
  { codigo: 'H-AC', nombre: 'África Central (BEAC)', continente: 'AF' },
  { codigo: 'H-ES', nombre: 'Estrechos (Straits Settlements)', continente: 'AS', mapa: 'MY' },
];

let nombresRegion = null;
try {
  nombresRegion = new Intl.DisplayNames(['es'], { type: 'region' });
} catch {
  nombresRegion = null;
}

const AJUSTES_NOMBRE = {
  US: 'Estados Unidos',
  GB: 'Reino Unido',
  KR: 'Corea del Sur',
  KP: 'Corea del Norte',
  PS: 'Palestina',
  VA: 'Ciudad del Vaticano',
};

export const PAISES = [];
export const PAIS_POR_CODIGO = new Map();

for (const fila of TABLA.trim().split(/[|\n]/)) {
  const [codigo, numerico, continente] = fila.trim().split(/\s+/);
  if (!codigo) continue;
  let nombre = AJUSTES_NOMBRE[codigo];
  if (!nombre) {
    try {
      nombre = nombresRegion ? nombresRegion.of(codigo) : codigo;
    } catch {
      nombre = codigo;
    }
  }
  const pais = { codigo, numerico: parseInt(numerico, 10), continente, nombre, historico: false, mapa: codigo };
  PAISES.push(pais);
  PAIS_POR_CODIGO.set(codigo, pais);
}

for (const h of HISTORICOS) {
  const pais = { ...h, historico: true, numerico: null, mapa: h.mapa || null };
  PAISES.push(pais);
  PAIS_POR_CODIGO.set(h.codigo, pais);
}

const comparador = new Intl.Collator('es', { sensitivity: 'base' });
PAISES.sort((a, b) => comparador.compare(a.nombre, b.nombre));

/** Número ISO -> código alfa-2 (para el mapa). */
export const CODIGO_POR_NUMERICO = new Map(
  PAISES.filter((p) => p.numerico != null).map((p) => [p.numerico, p.codigo])
);

export function nombrePais(codigo) {
  return PAIS_POR_CODIGO.get(codigo)?.nombre || codigo || 'Desconocido';
}

export function continenteDe(codigo) {
  return PAIS_POR_CODIGO.get(codigo)?.continente || 'XX';
}

/** Emoji de bandera (solo para países actuales). */
export function bandera(codigo) {
  if (!codigo || codigo.length !== 2) return '🏛️';
  return String.fromCodePoint(...[...codigo.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export function compararTexto(a, b) {
  return comparador.compare(a || '', b || '');
}

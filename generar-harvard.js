// Genera curriculum-harvard.html y curriculum-harvard.pdf (formato Harvard: una columna,
// blanco y negro, fácil de leer para los programas de selección) a partir de datos.json.
// Uso: node generar-harvard.js
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const d = JSON.parse(fs.readFileSync(path.join(dir, 'datos.json'), 'utf8'));

// Fuentes incrustadas desde fuentes/ (las mismas que la versión con diseño).
function fuente(familia, archivo, peso, estilo = 'normal') {
  const b64 = fs.readFileSync(path.join(dir, 'fuentes', archivo)).toString('base64');
  return `@font-face { font-family: '${familia}'; font-weight: ${peso}; font-style: ${estilo};
    src: url(data:font/ttf;base64,${b64}) format('truetype'); }`;
}
const fuentes = [
  fuente('Inter', 'Inter-400.ttf', 400),
  fuente('Inter', 'Inter-400i.ttf', 400, 'italic'),
  fuente('Inter', 'Inter-600.ttf', 600),
  fuente('Inter', 'Inter-700.ttf', 700),
  fuente('Space Grotesk', 'SpaceGrotesk-700.ttf', 700),
].join('\n');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// "09/2025 – 02/2026" -> "sept. 2025 – feb. 2026"
const meses = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];
const fecha = (s) => s.replace(/\b(\d{2})\/(\d{4})\b/g, (_, m, a) => `${meses[Number(m) - 1]} ${a}`);

// "Making Robots, Villanueva de la Serena (Badajoz)" -> ["Making Robots", "Villanueva de la Serena (Badajoz)"]
function separar(s) {
  const i = s.indexOf(', ');
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 2)];
}

// Agrupa entradas consecutivas del mismo centro o empresa, como pide el formato Harvard.
function agrupar(lista, clave) {
  const grupos = [];
  for (const el of lista) {
    const k = el[clave] || '';
    const ultimo = grupos[grupos.length - 1];
    if (k && ultimo && ultimo.clave === k) ultimo.items.push(el);
    else grupos.push({ clave: k, items: [el] });
  }
  return grupos;
}

// Pasa a minúscula la primera letra salvo en siglas o niveles como "B2".
const minuscula = (t) => (/^[A-ZÁÉÍÓÚ][a-záéíóúñ]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);

const fila = (izq, der, clase) =>
  `<div class="fila ${clase}"><span>${izq}</span><span>${der}</span></div>`;
const vinetas = (lista) =>
  lista && lista.length ? `<ul>${lista.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
const seccion = (titulo, contenido) => `<section><h2>${titulo}</h2>${contenido}</section>`;

const p = d.personales;
const campo = (k) => (p.campos.find(([c]) => c === k) || [])[1];
const contacto = [campo('Residencia') && campo('Residencia').replace(/, España$/, ''), campo('Teléfono'), campo('Correo electrónico')]
  .filter(Boolean).map(esc).join(' &nbsp;<span class="sep">·</span>&nbsp; ');

const educacion = agrupar(d.academicos, 'institucion').map((g) => {
  const [centro, lugar] = separar(g.clave);
  if (!g.clave) {
    return g.items.map((a) => `<div class="bloque">${fila(`<b>${esc(a.titulo)}</b>`, esc(fecha(a.fechas)), 'sub')}
      ${vinetas(a.detalle ? [a.detalle] : [])}</div>`).join('');
  }
  return `<div class="bloque">${fila(`<b>${esc(centro)}</b>`, esc(lugar), '')}
    ${g.items.map((a) => fila(`<i>${esc(a.titulo)}</i>`, esc(fecha(a.fechas)), 'sub') + vinetas(a.detalle ? [a.detalle] : [])).join('')}</div>`;
}).join('');

const experiencia = agrupar(d.profesionales, 'empresa').map((g) => {
  const [empresa, lugar] = separar(g.clave);
  return `<div class="bloque">${fila(`<b>${esc(empresa)}</b>`, esc(lugar), '')}
    ${g.items.map((e) => fila(`<i>${esc(e.puesto)}</i>`, esc(fecha(e.fechas)), 'sub') + vinetas(e.funciones)).join('')}</div>`;
}).join('');

const proyectos = (d.proyectos || []).map((pr) => `<div class="bloque">
  ${fila(`<b>${esc(pr.nombre)}</b>`, esc(pr.estado), '')}
  ${fila(`<i>${esc(pr.tipo)}</i>`, '', 'sub')}
  ${vinetas([pr.descripcion])}</div>`).join('');

const i = d.interes;
const habilidades = `<ul class="lineas">
  <li><b>Idiomas:</b> ${i.idiomas.map(([l, n]) => `${esc(l)} (${esc(minuscula(n).replace(' · ', ', '))})`).join('; ')}.</li>
  <li><b>Informática:</b> ${esc(i.informatica.domino.join(', '))}. Aprendiendo: ${esc(i.informatica.aprendiendo.join(', '))}.</li>
  <li><b>Robótica educativa:</b> ${esc(i.robotica.join(', '))}.</li>
  <li><b>Intereses:</b> ${esc(i.aficiones)}</li>
</ul>`;

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Currículum – ${esc(p.nombre)}</title>
<style>
  ${fuentes}
  :root { --oscuro: #16243a; --acento: #2a9d8f; --suave: #5b6876; --texto: #1f2933; }
  @page { size: A4; margin: 14mm 17mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; font-size: 9.8pt; line-height: 1.38; color: var(--texto); margin: 0; }
  header { text-align: center; padding-bottom: 7pt; margin-bottom: 2pt; }
  h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 24pt; color: var(--oscuro);
       margin: 0; line-height: 1.1; }
  .titular { color: var(--acento); font-weight: 600; margin-top: 2pt; }
  .contacto { color: var(--suave); margin-top: 3pt; }
  .contacto .sep { color: var(--acento); font-weight: 700; }
  header::after { content: ''; display: block; width: 18mm; height: 2.5pt; background: var(--acento);
                  margin: 8pt auto 0; border-radius: 2pt; }
  h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 11.5pt; color: var(--oscuro);
       text-transform: uppercase; margin: 11pt 0 5pt; padding-bottom: 2pt; border-bottom: 1.2pt solid var(--acento); }
  .bloque { margin-bottom: 6pt; break-inside: avoid; }
  .fila { display: flex; justify-content: space-between; gap: 10pt; }
  .fila b { color: var(--oscuro); }
  .fila span:last-child { white-space: nowrap; color: var(--suave); }
  .fila.sub i { color: var(--texto); }
  .fila.sub span:last-child { color: var(--acento); font-weight: 600; font-size: 9pt; }
  ul { margin: 1.5pt 0 3pt; padding-left: 15pt; }
  li { margin: 0.5pt 0; }
  li::marker { color: var(--acento); }
  ul.lineas { list-style: none; padding-left: 0; }
  ul.lineas li { margin: 2.5pt 0; }
  ul.lineas b { color: var(--oscuro); }
</style></head><body>
<header><h1>${esc(p.nombre)}</h1>${p.titular ? `<div class="titular">${esc(p.titular)}</div>` : ''}
<div class="contacto">${contacto}</div></header>
${seccion('Educación', educacion)}
${seccion('Experiencia', experiencia)}
${proyectos ? seccion('Proyectos personales', proyectos) : ''}
${seccion('Habilidades e intereses', habilidades)}
</body></html>`;

fs.writeFileSync(path.join(dir, 'curriculum-harvard.html'), html);

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(dir, 'curriculum-harvard.pdf'), format: 'A4', preferCSSPageSize: true, printBackground: true });
  await browser.close();
  console.log('Generado curriculum-harvard.pdf');
})();

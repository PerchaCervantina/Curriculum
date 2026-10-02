// Genera curriculum.html y curriculum.pdf a partir de datos.json.
// Uso: node generar.js
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const d = JSON.parse(fs.readFileSync(path.join(dir, 'datos.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function seccion(titulo, contenido) {
  return `<section><h2>${titulo}</h2>${contenido}</section>`;
}

function filas(pares) {
  return `<table class="campos">${pares
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('')}</table>`;
}

function filas2(pares) {
  const filasHtml = [];
  for (let i = 0; i < pares.length; i += 2) {
    filasHtml.push(`<tr>${pares.slice(i, i + 2)
      .map(([k, v]) => `<th>${esc(k)}</th><td>${esc(v)}</td>`).join('')}</tr>`);
  }
  return `<table class="campos dos">${filasHtml.join('')}</table>`;
}

function entrada(izq, sub, fechas, cuerpo) {
  return `<div class="entrada">
    <div class="cab"><strong>${esc(izq)}</strong><span>${esc(fechas)}</span></div>
    ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}${cuerpo || ''}</div>`;
}

const p = d.personales;
const foto = p.foto
  ? `<img class="foto" src="data:image/${path.extname(p.foto).slice(1).replace('jpg', 'jpeg')};base64,${fs
      .readFileSync(path.join(dir, p.foto))
      .toString('base64')}">`
  : '';

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Currículum – ${esc(p.nombre)}</title>
<style>
  @page { size: A4; margin: 12mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: "Liberation Serif", "Times New Roman", Times, serif; font-size: 10.5pt;
         color: #111; line-height: 1.27; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: center;
           border-bottom: 1.5pt solid #111; padding-bottom: 8pt; margin-bottom: 4pt; }
  h1 { font-size: 22pt; margin: 0; letter-spacing: 1pt; text-transform: uppercase; font-weight: bold; }
  .titular { font-style: italic; font-size: 12pt; margin-top: 2pt; }
  .foto { width: 28mm; height: 35mm; object-fit: cover; border: 0.5pt solid #111; }
  h2 { font-size: 12pt; text-transform: uppercase; letter-spacing: 1.5pt; margin: 9pt 0 4pt;
       border-bottom: 0.5pt solid #111; padding-bottom: 2pt; }
  table.campos { border-collapse: collapse; width: 100%; }
  table.campos th { text-align: left; font-weight: bold; width: 38mm; padding: 1.5pt 0; vertical-align: top; }
  table.campos td { padding: 1.5pt 0; }
  table.dos th { width: 33mm; }
  table.dos td { padding-right: 6mm; }
  .entrada { margin-bottom: 6pt; break-inside: avoid; }
  .cab { display: flex; justify-content: space-between; }
  .cab span { font-style: italic; white-space: nowrap; margin-left: 8pt; }
  .sub { font-style: italic; }
  ul { margin: 3pt 0 0 0; padding-left: 14pt; }
  li { margin: 1pt 0; }
  p.detalle { margin: 2pt 0 0; }
  h3 { font-size: 10.5pt; font-variant: small-caps; letter-spacing: 0.5pt; margin: 8pt 0 4pt; }
  p.sobre { margin: 8pt 0 0; text-align: justify; }
</style></head><body>
<header><div><h1>${esc(p.nombre)}</h1>${p.titular ? `<div class="titular">${esc(p.titular)}</div>` : ''}</div>${foto}</header>
${seccion('Datos personales', filas(p.campos) + (p.sobre_mi ? `<p class="sobre">${esc(p.sobre_mi)}</p>` : ''))}
${seccion('Datos académicos', d.academicos
  .map((a) => entrada(a.titulo, a.institucion, a.fechas, a.detalle ? `<p class="detalle">${esc(a.detalle)}</p>` : ''))
  .join(''))}
${seccion('Datos profesionales', d.profesionales
  .map((e) => entrada(e.puesto, e.empresa, e.fechas,
    e.funciones && e.funciones.length ? `<ul>${e.funciones.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''))
  .join('') + (d.proyectos && d.proyectos.length ? `<h3>Proyectos personales</h3>` + d.proyectos
  .map((pr) => entrada(pr.nombre, '', `${pr.tipo} · ${pr.estado}`, `<p class="detalle">${esc(pr.descripcion)}</p>`))
  .join('') : ''))}
${seccion('Datos de interés', filas(d.interes))}
</body></html>`;

fs.writeFileSync(path.join(dir, 'curriculum.html'), html);

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: path.join(dir, 'curriculum.pdf'), format: 'A4', preferCSSPageSize: true, printBackground: true });
  await browser.close();
  console.log('Generado curriculum.pdf');
})();

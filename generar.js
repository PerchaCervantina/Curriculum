// Genera curriculum.html y curriculum.pdf a partir de datos.json.
// Uso: node generar.js
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const d = JSON.parse(fs.readFileSync(path.join(dir, 'datos.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Fuentes incrustadas desde fuentes/ para que el PDF salga igual en cualquier equipo.
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
  fuente('Space Grotesk', 'SpaceGrotesk-500.ttf', 500),
  fuente('Space Grotesk', 'SpaceGrotesk-700.ttf', 700),
].join('\n');

// Iconos sencillos para los datos de contacto.
const iconos = {
  'Fecha de nacimiento': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  'Residencia': '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  'Teléfono': '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  'Correo electrónico': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
};
const icono = (k) => iconos[k]
  ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconos[k]}</svg>`
  : '';

const seccion = (titulo, contenido, clase = '') =>
  `<section class="${clase}"><h2>${titulo}</h2>${contenido}</section>`;

function entrada(titulo, sub, fechas, cuerpo) {
  return `<div class="entrada">
    <div class="fechas">${esc(fechas)}</div>
    <div class="titulo">${esc(titulo)}</div>
    ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}${cuerpo || ''}</div>`;
}

const chips = (lista, clase = '') =>
  `<div class="chips">${lista.map((c) => `<span class="chip ${clase}">${esc(c)}</span>`).join('')}</div>`;

const p = d.personales;
const i = d.interes;

const lateral = `
${seccion('Datos personales', `<ul class="contacto">${p.campos
  .map(([k, v]) => `<li>${icono(k)}<div><span class="etq">${esc(k)}</span>${esc(v)}</div></li>`)
  .join('')}</ul>`)}
${seccion('Datos de interés', `
  <h3>Idiomas</h3>
  <ul class="idiomas">${i.idiomas.map(([l, n]) => `<li><strong>${esc(l)}</strong><span>${esc(n)}</span></li>`).join('')}</ul>
  <h3>Informática</h3>
  ${chips(i.informatica.domino)}
  <div class="etq aprendiendo">Aprendiendo</div>
  ${chips(i.informatica.aprendiendo, 'hueco')}
  <h3>Robótica educativa</h3>
  ${chips(i.robotica)}
  <h3>Aficiones</h3>
  <p>${esc(i.aficiones)}</p>`)}`;

const principal = `
${p.sobre_mi ? `<p class="sobre">${esc(p.sobre_mi)}</p>` : ''}
${seccion('Datos académicos', `<div class="linea">${d.academicos
  .map((a) => entrada(a.titulo, a.institucion, a.fechas, a.detalle ? `<p class="detalle">${esc(a.detalle)}</p>` : ''))
  .join('')}</div>`)}
${seccion('Datos profesionales', `<div class="linea">${d.profesionales
  .map((e) => entrada(e.puesto, e.empresa, e.fechas,
    e.funciones && e.funciones.length ? `<ul class="funciones">${e.funciones.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''))
  .join('')}</div>
  ${d.proyectos && d.proyectos.length ? `<h3>Proyectos personales</h3><div class="proyectos">${d.proyectos
    .map((pr) => `<div class="proyecto"><div class="estado">${esc(pr.estado)}</div>
      <div class="titulo">${esc(pr.nombre)}</div><div class="sub">${esc(pr.tipo)}</div>
      <p class="detalle">${esc(pr.descripcion)}</p></div>`)
    .join('')}</div>` : ''}`)}`;

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Currículum – ${esc(p.nombre)}</title>
<style>
  ${fuentes}
  :root { --oscuro: #16243a; --acento: #2a9d8f; --acento-claro: #d5ece9; --lateral: #f2f5f7;
          --texto: #1f2933; --suave: #5b6876; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: 'Inter', sans-serif; font-size: 9pt; line-height: 1.4; color: var(--texto); }
  .hoja { width: 210mm; height: 297mm; display: grid; grid-template-columns: 66mm 1fr;
          grid-template-rows: auto 1fr; overflow: hidden; }

  header { grid-column: 1 / -1; background: var(--oscuro); color: #fff; padding: 11mm 12mm 9mm;
           position: relative; }
  header::after { content: ''; position: absolute; left: 12mm; bottom: 0; width: 22mm; height: 3pt;
                  background: var(--acento); }
  h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 27pt; margin: 0;
       letter-spacing: -0.3pt; line-height: 1.05; }
  .titular { margin-top: 4pt; font-size: 10.5pt; color: #9fd8cf; }
  .titular::before { content: '</> '; font-family: 'Space Grotesk', sans-serif; color: var(--acento); font-weight: 700; }

  aside { background: var(--lateral); padding: 8mm 7mm 8mm 9mm; }
  main { padding: 8mm 11mm 8mm 9mm; }

  h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 11pt; text-transform: uppercase;
       letter-spacing: 1pt; color: var(--oscuro); margin: 0 0 5pt; display: flex; align-items: center; gap: 6pt; }
  h2::before { content: ''; width: 9pt; height: 9pt; border-radius: 2pt; background: var(--acento); flex: none; }
  section { margin-bottom: 9pt; }
  h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 500; font-size: 9.5pt; color: var(--acento);
       margin: 8pt 0 3pt; }
  aside p { margin: 0; }
  .etq { display: block; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.6pt; color: var(--suave); }

  ul.contacto { list-style: none; margin: 0; padding: 0; }
  ul.contacto li { display: flex; gap: 6pt; align-items: flex-start; margin-bottom: 5pt; }
  ul.contacto svg { width: 11pt; height: 11pt; color: var(--acento); flex: none; margin-top: 4pt; }

  ul.idiomas { list-style: none; margin: 0; padding: 0; }
  ul.idiomas li { margin-bottom: 3pt; }
  ul.idiomas span { display: block; color: var(--suave); font-size: 8pt; }

  .chips { display: flex; flex-wrap: wrap; gap: 3pt; }
  .chip { background: var(--oscuro); color: #fff; border-radius: 10pt; padding: 1.5pt 6pt; font-size: 8pt;
          font-weight: 600; border: 0.8pt solid var(--oscuro); }
  .chip.hueco { background: transparent; color: var(--oscuro); }
  .aprendiendo { margin: 4pt 0 2pt; }

  p.sobre { margin: 0 0 10pt; padding: 2pt 0 2pt 8pt; border-left: 2.5pt solid var(--acento);
            font-size: 9.5pt; color: #33404d; }

  .linea { border-left: 1.2pt solid var(--acento-claro); margin-left: 3pt; padding-left: 10pt; }
  .entrada { position: relative; margin-bottom: 6pt; break-inside: avoid; }
  .entrada::before { content: ''; position: absolute; left: -14.2pt; top: 3pt; width: 5.5pt; height: 5.5pt;
                     border-radius: 50%; background: #fff; border: 1.6pt solid var(--acento); }
  .fechas { font-size: 7.5pt; font-weight: 600; color: var(--acento); text-transform: uppercase; letter-spacing: 0.4pt; }
  .titulo { font-weight: 700; font-size: 9.5pt; color: var(--oscuro); }
  .sub { font-style: italic; color: var(--suave); }
  p.detalle { margin: 1pt 0 0; }
  ul.funciones { margin: 2pt 0 0; padding-left: 11pt; }
  ul.funciones li { margin: 1pt 0; }
  ul.funciones li::marker { color: var(--acento); }

  .proyectos { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; }
  .proyecto { border: 0.8pt solid #dde3e8; border-top: 2.5pt solid var(--acento); border-radius: 3pt;
              padding: 5pt 7pt 6pt; }
  .estado { display: inline-block; font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4pt;
            background: var(--acento-claro); color: #1d6f65; border-radius: 8pt; padding: 0.5pt 5pt; margin-bottom: 3pt; }
  .proyecto .detalle { font-size: 8.5pt; }
</style></head><body>
<div class="hoja">
  <header><h1>${esc(p.nombre)}</h1>${p.titular ? `<div class="titular">${esc(p.titular)}</div>` : ''}</header>
  <aside>${lateral}</aside>
  <main>${principal}</main>
</div>
</body></html>`;

fs.writeFileSync(path.join(dir, 'curriculum.html'), html);

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // Avisa si el contenido no cabe en la página (la hoja recorta lo que sobra).
  const desborde = await page.evaluate(() =>
    [...document.querySelectorAll('aside, main')].some((el) => el.scrollHeight > el.clientHeight + 1));
  if (desborde) console.warn('AVISO: el contenido no cabe en una página A4.');
  await page.pdf({ path: path.join(dir, 'curriculum.pdf'), format: 'A4', preferCSSPageSize: true, printBackground: true });
  await browser.close();
  console.log('Generado curriculum.pdf');
})();

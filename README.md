# Currículum – Hugo Rejas Fernández

Dos versiones generadas a partir de los mismos datos (`datos.json`):

| Archivo | Para qué |
|---|---|
| `curriculum.pdf` | Diseño con color, para enviar por correo o llevar en mano. |
| `curriculum-harvard.pdf` | Formato Harvard (una columna, blanco y negro), para portales de empleo. |

Para regenerarlas tras cambiar `datos.json`:

```sh
node generar.js          # curriculum.pdf
node generar-harvard.js  # curriculum-harvard.pdf
```

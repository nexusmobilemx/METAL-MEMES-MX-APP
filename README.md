# Metal Memes MX

App web (HTML estático) para crear posts de noticias de metal: noticia → plantilla → caption → descarga PNG.

## Desarrollo

```bash
npm install
npm run build:css   # compila Tailwind a styles.css (commitéalo)
npm test            # pruebas del script de noticias
npm run news        # genera news.json e img/ localmente
```

`index.html` + `styles.css` + `news.json` + `img/` son lo único que se publica. Para probar la app con `news.json`
sírvela por HTTP (`python3 -m http.server`), no como archivo.

## Noticias automáticas (GitHub Actions)

`.github/workflows/news.yml` corre cada 3 horas (y a mano desde la pestaña Actions):

1. Lee los RSS de `scripts/fetch-news.mjs` (`FEEDS`) y guarda `news.json` + las fotos en `img/`.
2. Si existe el secreto `ANTHROPIC_API_KEY`, Claude traduce el titular al español y genera 4 captions por noticia (uno por tono).
   Sin la clave se publican los titulares originales y la app usa sus plantillas de caption.

Configuración, una sola vez:

1. Repo → Settings → Secrets and variables → Actions → **New repository secret** → `ANTHROPIC_API_KEY` (opcional).
2. Settings → Actions → General → Workflow permissions → **Read and write permissions**.
3. Los workflows programados solo corren desde la rama por defecto: haz merge de estos cambios ahí.
4. Settings → Pages → publica desde la rama por defecto (raíz).

Las fotos de las noticias son de terceros; úsalas como referencia y prefiere imágenes propias o de prensa (botón SUBIR).

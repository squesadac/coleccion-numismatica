# Colección Numismática

A digital binder for a family coin and banknote collection: albums laid out like the physical binders, a searchable catalog, a world map, and a page for each item with front and back photos and its story. The interface is in Spanish.

Plain HTML, CSS and JavaScript (ES modules), with no build step. GitHub Pages can host it as-is.

## See it locally

Double-click `ver-sitio.bat` (it needs Python), or run:

```
python -m http.server 8765
```

and open http://localhost:8765/. Opening `index.html` directly from the file system won't work, because ES modules need a web server.

## Current state: demo mode

`js/config.js` has `modo: 'demo'`:

- The site shows about 160 generated sample items, with drawn placeholder images.
- **Entrar** (footer) logs in without a password. Edits, new items and photos are saved **only in that browser** (localStorage, roughly 25 photos at most).
- *Administrar → Respaldo* can download or restore a JSON backup, reset the sample data, or start with an empty collection.

## Configuration

`js/config.js`: site title, subtitle, collector's name, and the material and condition lists.

## Structure

```
index.html              page shell (header, menu, footer)
css/styles.css          all styles (light and dark themes)
js/app.js               hash router (#/catalogo, #/album/x, #/pieza/x, …)
js/config.js            site settings
js/data/store.js        data layer: the only file that changes when moving to Supabase
js/data/countries.js    countries + historical entities, ISO codes, continents
js/data/sample.js       sample data
js/placeholder.js       SVG placeholder images
js/image.js             photo compression in the browser (WebP, with JPEG fallback)
js/views/*.js           one file per page
```

## Next steps (roadmap)

1. **Supabase**: real database + login for the admin. The schema keeps private fields (purchase price, value, storage location) in a table that only the admin can read.
2. **Photo storage** (Cloudflare R2 or Supabase Storage).
3. **Publish on GitHub Pages**: Settings → Pages → deploy from `main` / root.
4. Scheduled GitHub Action that pings Supabase so the free project isn't paused for inactivity.
5. Optional: Numista API autofill, spreadsheet import.

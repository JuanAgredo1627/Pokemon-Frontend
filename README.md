# Pokédex PWA (frontend)
Frontend estático (HTML + CSS + JS modular, sin build) que consume https://pokedex-backend-g1ql.onrender.com

## Estructura
- `config.js` URL del backend (único lugar a editar) · `api.js` acceso a datos, reintentos y caché
- `theme.js` paleta por tipo · `app.js` vistas (catálogo/ficha) y navegación · `styles.css`
- `manifest.webmanifest`, `sw.js`, `icons/` PWA

## Ejecutar en local (la PWA requiere http://localhost o HTTPS)
    npx serve .        # o: python3 -m http.server 8080

## Desplegar (HTTPS)
Sube la carpeta tal cual a Render (Static Site, publish dir `.`, sin build), Netlify, Vercel o GitHub Pages.
El backend ya tiene CORS abierto (`CORS_ORIGIN=*`); si lo restringes, añade el dominio del frontend.
Instalación en Android: Chrome > menú > "Instalar aplicación".

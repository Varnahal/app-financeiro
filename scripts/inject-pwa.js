// Injeta as tags de PWA (manifesto, ícones, tema) e o CSS global de
// cursor/hover no index.html gerado pelo `expo export`.
//
// Necessário porque o modo web "single" (SPA) usa um index.html fixo do Expo e
// não aplica app/+html.tsx. Roda depois do export (ver "build:web" no
// package.json e o buildCommand no vercel.json). É idempotente.

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(file)) {
  console.error('inject-pwa: dist/index.html não encontrado. Rode o export primeiro.');
  process.exit(1);
}

let html = fs.readFileSync(file, 'utf8');

const headInject = `    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#208AEF" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Buffa Finance" />
    <style>
      [role="button"], [role="link"] { cursor: pointer; }
      [tabindex]:not([tabindex="-1"]):not(input):not(textarea) { cursor: pointer; }
      @media (hover: hover) {
        [tabindex]:not([tabindex="-1"]):not(input):not(textarea) { transition: opacity 0.12s ease; }
        [tabindex]:not([tabindex="-1"]):not(input):not(textarea):hover { opacity: 0.9; }
      }
    </style>
  `;

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', headInject + '</head>');
}
html = html.replace('<html lang="en">', '<html lang="pt-BR">');

fs.writeFileSync(file, html);
console.log('inject-pwa: tags de PWA e CSS injetados em dist/index.html');

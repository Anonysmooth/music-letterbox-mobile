/**
 * Script pour générer les icônes de l'application
 *
 * Prérequis : npm install sharp
 * Usage : node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Vérifier si sharp est installé
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp n\'est pas installé. Installation en cours...');
  const { execSync } = require('child_process');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  sharp = require('sharp');
}

const COLORS = {
  background: '#14181c',
  accent: '#00e054',
  white: '#ffffff',
};

// Créer une icône SVG
const createIconSVG = (size, isAdaptive = false) => {
  const padding = isAdaptive ? size * 0.15 : size * 0.1;
  const innerSize = size - padding * 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Note de musique simplifiée
  const noteScale = innerSize / 100;

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${COLORS.background}" rx="${isAdaptive ? 0 : size * 0.2}"/>
      <g transform="translate(${centerX - 25 * noteScale}, ${centerY - 35 * noteScale}) scale(${noteScale})">
        <!-- Note de musique -->
        <ellipse cx="15" cy="60" rx="12" ry="10" fill="${COLORS.accent}"/>
        <ellipse cx="45" cy="55" rx="12" ry="10" fill="${COLORS.accent}"/>
        <rect x="23" y="10" width="4" height="50" fill="${COLORS.accent}"/>
        <rect x="53" y="5" width="4" height="50" fill="${COLORS.accent}"/>
        <path d="M 27 10 Q 40 0 57 5 L 57 15 Q 40 10 27 20 Z" fill="${COLORS.accent}"/>
      </g>
      <text x="${centerX}" y="${size - padding * 0.7}"
            font-family="Arial, sans-serif"
            font-size="${size * 0.08}"
            font-weight="bold"
            fill="${COLORS.white}"
            text-anchor="middle">
        Music Letterbox
      </text>
    </svg>
  `;
};

// Créer le splash screen SVG
const createSplashSVG = (width, height) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const noteScale = 3;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${COLORS.background}"/>
      <g transform="translate(${centerX - 75}, ${centerY - 120}) scale(${noteScale})">
        <!-- Note de musique -->
        <ellipse cx="15" cy="60" rx="12" ry="10" fill="${COLORS.accent}"/>
        <ellipse cx="45" cy="55" rx="12" ry="10" fill="${COLORS.accent}"/>
        <rect x="23" y="10" width="4" height="50" fill="${COLORS.accent}"/>
        <rect x="53" y="5" width="4" height="50" fill="${COLORS.accent}"/>
        <path d="M 27 10 Q 40 0 57 5 L 57 15 Q 40 10 27 20 Z" fill="${COLORS.accent}"/>
      </g>
      <text x="${centerX}" y="${centerY + 150}"
            font-family="Arial, sans-serif"
            font-size="48"
            font-weight="bold"
            fill="${COLORS.white}"
            text-anchor="middle">
        Music Letterbox
      </text>
      <text x="${centerX}" y="${centerY + 200}"
            font-family="Arial, sans-serif"
            font-size="24"
            fill="#99aabb"
            text-anchor="middle">
        Votre collection musicale
      </text>
    </svg>
  `;
};

async function generateIcons() {
  const assetsDir = path.join(__dirname, '..', 'assets');

  // Créer le dossier assets s'il n'existe pas
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('Génération des icônes...');

  // Icon (1024x1024)
  const iconSVG = createIconSVG(1024);
  await sharp(Buffer.from(iconSVG))
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ icon.png (1024x1024)');

  // Adaptive Icon (1024x1024)
  const adaptiveIconSVG = createIconSVG(1024, true);
  await sharp(Buffer.from(adaptiveIconSVG))
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png (1024x1024)');

  // Favicon (48x48)
  const faviconSVG = createIconSVG(48);
  await sharp(Buffer.from(faviconSVG))
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ favicon.png (48x48)');

  // Splash (1284x2778)
  const splashSVG = createSplashSVG(1284, 2778);
  await sharp(Buffer.from(splashSVG))
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  console.log('✓ splash.png (1284x2778)');

  console.log('\nToutes les icônes ont été générées avec succès !');
}

generateIcons().catch(console.error);

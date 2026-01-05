import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginDir = join(__dirname, '..', 'com.joshroman.swapmonitor.sdPlugin', 'imgs');

// Create a simple swap icon as an SVG
function createSwapIconSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.375;
  const stroke = size * 0.083;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#333333" stroke-width="${stroke}"/>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#33DD33" stroke-width="${stroke}"
        stroke-dasharray="${2 * Math.PI * radius}" stroke-dashoffset="${Math.PI * radius}"
        stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy + size * 0.055}" text-anchor="middle" fill="white"
        font-size="${size * 0.166}" font-weight="bold" font-family="system-ui">SWAP</text>
  </svg>`;
}

// Create a plugin icon (memory chip style)
function createPluginIconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.111}" fill="#1a1a1a"/>
    <rect x="${size * 0.222}" y="${size * 0.292}" width="${size * 0.556}" height="${size * 0.417}" rx="4" fill="#333" stroke="#666" stroke-width="2"/>
    <rect x="${size * 0.153}" y="${size * 0.361}" width="${size * 0.069}" height="${size * 0.042}" fill="#666"/>
    <rect x="${size * 0.153}" y="${size * 0.431}" width="${size * 0.069}" height="${size * 0.042}" fill="#666"/>
    <rect x="${size * 0.153}" y="${size * 0.500}" width="${size * 0.069}" height="${size * 0.042}" fill="#666"/>
    <rect x="${size * 0.153}" y="${size * 0.569}" width="${size * 0.069}" height="${size * 0.042}" fill="#666"/>
    <rect x="${size * 0.778}" y="${size * 0.361}" width="${size * 0.069}" height="${size * 0.042}" fill="#666"/>
    <rect x="${size * 0.778}" y="${size * 0.431}" width="${size * 0.069}" height="${size * 0.042}" fill="#666"/>
    <rect x="${size * 0.778}" y="${size * 0.500}" width="${size * 0.069}" height="${size * 0.042}" fill="#666"/>
    <rect x="${size * 0.778}" y="${size * 0.569}" width="${size * 0.069}" height="${size * 0.042}" fill="#666"/>
    <path d="M${size * 0.361} ${size * 0.451} L${size * 0.5} ${size * 0.382} L${size * 0.5} ${size * 0.417} L${size * 0.639} ${size * 0.417} L${size * 0.639} ${size * 0.486} L${size * 0.5} ${size * 0.486} L${size * 0.5} ${size * 0.521} L${size * 0.361} ${size * 0.451}" fill="#33DD33"/>
    <path d="M${size * 0.639} ${size * 0.549} L${size * 0.5} ${size * 0.618} L${size * 0.5} ${size * 0.583} L${size * 0.361} ${size * 0.583} L${size * 0.361} ${size * 0.514} L${size * 0.5} ${size * 0.514} L${size * 0.5} ${size * 0.479} L${size * 0.639} ${size * 0.549}" fill="#FFAA00"/>
  </svg>`;
}

// Create a category icon (gear style)
function createCategoryIconSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cy}" r="${size * 0.429}" fill="none" stroke="#808080" stroke-width="${size * 0.054}"/>
    <circle cx="${cx}" cy="${cy}" r="${size * 0.214}" fill="#808080"/>
    <rect x="${size * 0.464}" y="${size * 0.036}" width="${size * 0.071}" height="${size * 0.143}" fill="#808080"/>
    <rect x="${size * 0.464}" y="${size * 0.821}" width="${size * 0.071}" height="${size * 0.143}" fill="#808080"/>
    <rect x="${size * 0.036}" y="${size * 0.464}" width="${size * 0.143}" height="${size * 0.071}" fill="#808080"/>
    <rect x="${size * 0.821}" y="${size * 0.464}" width="${size * 0.143}" height="${size * 0.071}" fill="#808080"/>
  </svg>`;
}

async function createIcon(svg, outputPath) {
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  console.log(`Created: ${outputPath}`);
}

async function main() {
  // Ensure directories exist
  await mkdir(join(pluginDir, 'actions'), { recursive: true });

  // Create action icons (72x72 and 144x144 for retina)
  await createIcon(createSwapIconSvg(72), join(pluginDir, 'actions', 'swap.png'));
  await createIcon(createSwapIconSvg(144), join(pluginDir, 'actions', 'swap@2x.png'));

  // Create plugin icon (72x72 and 144x144)
  await createIcon(createPluginIconSvg(72), join(pluginDir, 'plugin.png'));
  await createIcon(createPluginIconSvg(144), join(pluginDir, 'plugin@2x.png'));

  // Create category icon (28x28 and 56x56)
  await createIcon(createCategoryIconSvg(28), join(pluginDir, 'category.png'));
  await createIcon(createCategoryIconSvg(56), join(pluginDir, 'category@2x.png'));

  console.log('All icons generated successfully!');
}

main().catch(console.error);

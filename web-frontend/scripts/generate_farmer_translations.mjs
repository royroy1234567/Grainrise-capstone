import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Locate backend/.env to read AI configuration
const envPath = path.resolve(__dirname, '../../backend/.env');
let apiKey = process.env.GRAINRISE_AI_API_KEY || '';
let endpoint = process.env.GRAINRISE_AI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    const val = v.join('=').trim();
    if (k.trim() === 'GRAINRISE_AI_API_KEY' && !apiKey) apiKey = val;
    if (k.trim() === 'GRAINRISE_AI_ENDPOINT' && !process.env.GRAINRISE_AI_ENDPOINT) endpoint = val;
  }
}

if (!apiKey) {
  console.error('ERROR: No GRAINRISE_AI_API_KEY found in environment or backend/.env');
  process.exit(1);
}

const targetLanguages = [
  {
    code: 'ceb',
    name: 'Cebuano',
    instructions: 'natural Cebuano / Bisaya terminology for Filipino rice farmers (e.g., humay, uma, ani, tanom, suki, baligya)',
  },
  {
    code: 'hil',
    name: 'Hiligaynon',
    instructions: 'natural Hiligaynon / Ilonggo terminology for Filipino rice farmers (e.g., humay, talamnan/uma, patubas/ani, tanum, baligya, pulong, suki)',
  },
  {
    code: 'ilo',
    name: 'Ilocano',
    instructions: 'natural Ilocano terminology for Filipino rice farmers (e.g., pagay, talon, gani, mula, pagsasao, sukat)',
  },
];

const cacheFile = path.resolve(__dirname, 'farmer_translations_cache.json');
let cache = { ceb: {}, hil: {}, ilo: {} };
if (fs.existsSync(cacheFile)) {
  try {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (!cache.ceb) cache.ceb = {};
    if (!cache.hil) cache.hil = {};
    if (!cache.ilo) cache.ilo = {};
  } catch (e) {
    cache = { ceb: {}, hil: {}, ilo: {} };
  }
}

function saveCache() {
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
}

const candidateModels = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
];

async function callGemini(prompt, timeoutMs = 45000) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are a localization expert for Philippine agriculture. You translate JSON objects into regional Philippine languages (Cebuano, Hiligaynon/Ilonggo, Ilocano). Maintain identical JSON keys, structure, and keep placeholders like {name}, {amount}, {max}, {method} completely intact. Output ONLY valid JSON.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.1,
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text();
          if (res.status === 429) {
            console.warn(`  [RATE LIMIT] ${model} 429. Trying next model...`);
            continue;
          }
          if (res.status === 503) {
            console.warn(`  [BUSY] ${model} 503. Trying next model...`);
            continue;
          }
          console.warn(`  [WARN] ${model} HTTP ${res.status}: ${errBody.slice(0, 80)}`);
          continue;
        }

        const data = await res.json();
        let text = data.choices?.[0]?.message?.content || '';
        text = text.trim();
        if (text.startsWith('```json')) {
          text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (text.startsWith('```')) {
          text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        return JSON.parse(text);
      } catch (err) {
        console.warn(`  [WARN] ${model} error:`, err.message);
      }
    }

    const waitDelay = attempt * 4000;
    console.log(`  Waiting ${waitDelay / 1000}s before next attempt loop...`);
    await new Promise((r) => setTimeout(r, waitDelay));
  }

  throw new Error('Failed to obtain translation after multiple model attempts.');
}

async function main() {
  console.log('🌾 GrainRise Farmer Module AI Translation Generator');
  console.log('   Target Languages: Cebuano (ceb), Hiligaynon (hil), Ilocano (ilo)');
  console.log('   Models:', candidateModels.join(', '));

  const translationsModule = await import('../src/lib/translations.js');
  const enFarmer = translationsModule.translations.en.farmer;
  const tlFarmer = translationsModule.translations.tl.farmer;

  const sections = Object.keys(enFarmer);
  console.log(`\nFound ${sections.length} Farmer sections:`, sections.join(', '));

  for (const lang of targetLanguages) {
    console.log(`\n==================================================`);
    console.log(`Translating for: ${lang.name} [${lang.code}]`);
    console.log(`==================================================`);

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];

      if (cache[lang.code] && cache[lang.code][sec]) {
        console.log(`[${i + 1}/${sections.length}] Section "${sec}" [${lang.code}] loaded from cache.`);
        continue;
      }

      console.log(`[${i + 1}/${sections.length}] Translating "${sec}" into ${lang.name}...`);

      const enData = enFarmer[sec];
      const tlData = tlFarmer ? tlFarmer[sec] : null;

      const prompt = `Translate the values in this JSON object into ${lang.name} (${lang.code}).
Terminology guidance: ${lang.instructions}.
Preserve exact same JSON keys and structure.
Keep placeholders like {name}, {amount}, {max}, {method} unchanged.

English base:
${JSON.stringify(enData, null, 2)}

Tagalog reference:
${tlData ? JSON.stringify(tlData, null, 2) : 'None'}

Return ONLY the translated JSON object.`;

      try {
        const translated = await callGemini(prompt);
        if (!cache[lang.code]) cache[lang.code] = {};
        cache[lang.code][sec] = translated;
        saveCache();
        console.log(`  ✓ Successfully translated & cached "${sec}" [${lang.code}]`);
        // Gentle delay between requests
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`  ✗ Error translating "${sec}" [${lang.code}]:`, err.message);
        process.exit(1);
      }
    }
  }

  // Generate output file
  const outputPath = path.resolve(__dirname, '../src/lib/farmerTranslations.generated.js');
  const fileContent = `// AUTO-GENERATED FILE BY scripts/generate_farmer_translations.mjs
// Generated for Farmer User Module localization (Cebuano / Hiligaynon / Ilocano)
// Do not edit manually; re-run 'node scripts/generate_farmer_translations.mjs' via PowerShell to regenerate.

export const farmerCebTranslations = ${JSON.stringify(cache.ceb, null, 2)};

export const farmerHilTranslations = ${JSON.stringify(cache.hil, null, 2)};

export const farmerIloTranslations = ${JSON.stringify(cache.ilo, null, 2)};
`;

  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`\n🎉 Generated translations successfully saved to:\n   ${outputPath}`);
}

main().catch((err) => {
  console.error('Fatal generator error:', err);
  process.exit(1);
});

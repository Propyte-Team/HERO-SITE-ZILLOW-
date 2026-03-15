import { chromium } from 'playwright';

const pages = [
  { name: '01-homepage', url: 'http://localhost:3000/es', fullPage: true },
  { name: '02-marketplace', url: 'http://localhost:3000/es/propiedades', fullPage: false },
  { name: '03-propiedad', url: 'http://localhost:3000/es/propiedades/nativa-tulum-tipo-b', fullPage: true },
  { name: '04-desarrolladores', url: 'http://localhost:3000/es/desarrolladores', fullPage: true },
  { name: '05-contacto', url: 'http://localhost:3000/es/contacto', fullPage: true },
  { name: '06-homepage-en', url: 'http://localhost:3000/en', fullPage: true },
];

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  for (const page of pages) {
    const p = await context.newPage();
    console.log(`Capturing ${page.name}...`);
    await p.goto(page.url, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1000);
    await p.screenshot({
      path: `/Users/felipesolarluksic/real-estate-agent/propyte-web/screenshots/${page.name}.png`,
      fullPage: page.fullPage,
    });
    await p.close();
  }

  await browser.close();
  console.log('Done! All screenshots saved.');
}

capture().catch(console.error);

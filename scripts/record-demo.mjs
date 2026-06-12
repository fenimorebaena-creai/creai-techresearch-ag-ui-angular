// Records a silent screencast backup of the AG-UI demo (TR-306).
//
// Drives the live app through the same beats as docs/demo-runbook.md §2 and
// records video, so we always have a visual fallback if the live demo fails.
//
// Prereqs:
//   - api on :8001 and web on :4200 (e.g. `make dev` in another terminal)
//   - playwright available. If it is not installed, install it pointing at the
//     browsers already cached by the Playwright MCP server (no re-download):
//       PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/ms-playwright" \
//         npm exec --yes playwright@1 -- --version   # warms the package
//   - A full ffmpeg for the optional webm -> mp4 conversion. NOTE: Playwright's
//     bundled ffmpeg (~/.cache/ms-playwright/ffmpeg-*) is a minimal build with
//     no mp4 muxer, so use a system ffmpeg for the conversion. The .webm output
//     already plays in any browser / VLC and is a fine backup on its own.
//
// Usage:
//   PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/ms-playwright" node scripts/record-demo.mjs
//
// Output: docs/media/<page-id>.webm  (convert to .mp4 with the printed command).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:4200';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.OUT_DIR ?? join(repoRoot, 'docs', 'media');
const size = { width: 1280, height: 900 };

// Beats mirror docs/demo-runbook.md §2. Each query hits a distinct intent so the
// recording shows varied answers and clauses, not one canned reply.
const QUERIES = [
  'What is the overtime rate?',
  'How does seniority affect layoffs?',
  'How do I file a grievance?',
  'How much vacation do I accrue?',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: size,
    recordVideo: { dir: outDir, size },
  });
  const page = await context.newPage();

  await page.goto(WEB_URL, { waitUntil: 'networkidle' });
  await sleep(1200);

  for (let i = 0; i < QUERIES.length; i++) {
    const q = QUERIES[i];
    const input = page.getByRole('textbox', { name: /Ask about a CBA clause/i });
    await input.click();
    // Type with a small delay so the keystrokes are visible on the recording.
    await input.fill('');
    await input.pressSequentially(q, { delay: 35 });
    await sleep(300);
    await input.press('Enter');

    // Wait for the tool pill to complete and a clause to land in the panel.
    await page.getByText('completed', { exact: false }).first().waitFor({ timeout: 15000 });
    await page.locator('aside .clauses li, .context-pane li').first().waitFor({ timeout: 15000 });
    await sleep(3500); // let the audience read

    if (i < QUERIES.length - 1) {
      await page.getByRole('button', { name: /reset/i }).click();
      await sleep(800);
    }
  }

  await sleep(1200);
  // Closing the context flushes the .webm to disk and resolves its path.
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  const mp4 = videoPath.replace(/\.webm$/, '.mp4');
  console.log(`\nRecorded: ${videoPath}`);
  console.log('The .webm plays in any browser / VLC. To make an .mp4 (needs a full ffmpeg):');
  console.log(
    `  ffmpeg -y -i "${videoPath}" -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${mp4}"`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

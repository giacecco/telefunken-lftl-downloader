#!/usr/bin/env bun
import { join, extname } from "path";
import { $ } from "bun";

const BASE_DIR = "/Volumes/home/music/multitracks/Telefunken Elektroakustik";

async function downloadRoughMaster(artist: string, track: string, destDir: string): Promise<void> {
  const outTemplate = destDir + "/rough master.%(ext)s";
  const query = `${artist} ${track} Live From The Lab TELEFUNKEN`;

  const result = await $`yt-dlp https://www.youtube.com/@LiveFromTheLab/videos --match-title ${artist} --max-downloads 1 -f 140 -o ${outTemplate} --no-playlist --quiet --no-warnings --sleep-interval 5 --max-sleep-interval 15 --limit-rate 2M`.nothrow();

  if (result.exitCode !== 0 && result.exitCode !== 101) {
    console.log(`    [video] channel search failed, trying yt-dlp search…`);
    const searchUrl = "ytsearch1:" + query;
    const fallback = await $`yt-dlp ${searchUrl} -f 140 -o ${outTemplate} --no-playlist --quiet --no-warnings --sleep-interval 5 --max-sleep-interval 15 --limit-rate 2M`.nothrow();
    if (fallback.exitCode !== 0) {
      console.error(`    [error] could not find video for ${artist} - ${track}`);
    } else {
      console.log(`    [video] rough master downloaded (via search)`);
    }
  } else {
    console.log(`    [video] rough master downloaded`);
  }
}

const topEntries = await $`ls -1A "${BASE_DIR}"`.quiet().text();
const folders = topEntries.trim().split("\n").filter(e => e && !e.startsWith("._") && e !== ".DS_Store");

let processed = 0;

for (const folder of folders) {
  const dir = join(BASE_DIR, folder);
  const isDir = await $`test -d "${dir}"`.nothrow();
  if (isDir.exitCode !== 0) continue;

  const entries = new Bun.Glob("*").scanSync({ cwd: dir });
  const files = [...entries];

  const hasRoughMaster = files.some(f => f.startsWith("rough master."));
  const strayM4a = files.filter(f => !f.startsWith("rough master.") && extname(f).toLowerCase() === ".m4a");

  if (hasRoughMaster) {
    console.log(`[skip] ${folder}`);
    continue;
  }

  // Delete any stray m4a files
  for (const f of strayM4a) {
    const fullPath = join(dir, f);
    console.log(`  [delete] stray m4a: ${f}`);
    await $`rm "${fullPath}"`.quiet();
  }

  // Extract artist and track from folder name "[Artist] - [Track]"
  const dashIdx = folder.indexOf(" - ");
  const artist = dashIdx !== -1 ? folder.slice(0, dashIdx) : folder;
  const track = dashIdx !== -1 ? folder.slice(dashIdx + 3) : "";

  console.log(`[download] rough master for: ${folder}`);
  await downloadRoughMaster(artist, track, dir);
  processed++;
}

console.log(`\nDone — downloaded ${processed} rough masters.`);

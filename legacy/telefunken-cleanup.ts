#!/usr/bin/env bun
import { join } from "path";
import { $ } from "bun";

const BASE_DIR = "/Volumes/home/music/multitracks/Telefunken Elektroakustik";

// Clean up Mac junk at the base level first
await $`find "${BASE_DIR}" -maxdepth 1 -name "._*" -delete 2>/dev/null; find "${BASE_DIR}" -maxdepth 1 -name ".DS_Store" -delete 2>/dev/null; true`.quiet();

const topEntries = await $`ls -1A "${BASE_DIR}"`.quiet().text();
const folders = topEntries.trim().split("\n").filter(e => e && !e.startsWith("._") && e !== ".DS_Store");

for (const folder of folders) {
  const dir = join(BASE_DIR, folder);
  const stat = await $`test -d "${dir}"`.nothrow();
  if (stat.exitCode !== 0) continue;

  // Remove Mac junk inside the folder
  await $`find "${dir}" -name "__MACOSX" -exec rm -rf {} + 2>/dev/null; find "${dir}" -name "._*" -delete 2>/dev/null; find "${dir}" -name ".DS_Store" -delete 2>/dev/null; true`.quiet();

  // Flatten single top-level subdirectory
  const entries = (await $`ls -1A "${dir}"`.quiet().text()).trim().split("\n").filter(e => e && !e.startsWith("._") && e !== ".DS_Store");
  if (entries.length === 1) {
    const singleEntry = join(dir, entries[0]);
    const isDir = await $`test -d "${singleEntry}"`.nothrow();
    if (isDir.exitCode === 0) {
      console.log(`[flatten] ${folder}/${entries[0]}`);
      await $`mv "${singleEntry}"/* "${dir}/" 2>/dev/null; mv "${singleEntry}"/.[!.]* "${dir}/" 2>/dev/null; rmdir "${singleEntry}"; true`.quiet();
    }
  }
}

console.log(`Done — processed ${folders.length} folders.`);

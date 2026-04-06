#!/usr/bin/env bun
import { existsSync, mkdirSync } from "fs";
import { join, extname, basename } from "path";
import { $ } from "bun";

const destDir = process.argv[2];
if (!destDir) {
  console.error("Usage: bun telefunken-download.ts <destination-directory>");
  process.exit(1);
}
if (!existsSync(destDir)) {
  console.error(`Error: destination directory does not exist: ${destDir}`);
  process.exit(1);
}
const BASE_DIR = destDir;

// Audio file extensions to convert to FLAC
const AUDIO_EXTENSIONS = new Set([".wav", ".aiff", ".aif", ".mp3", ".ogg", ".flac"]);

interface Track {
  artist: string;
  track: string;
  url: string;
  sourceUrl: string;
}

const CACHE_FILE = "/tmp/telefunken-tracks-cache.json";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const S3_URL_REGEX = /https?:\/\/(?:season\d+multitracks|multitrackslive|multitracksstudio)\.s3(?:\.us-east-2)?\.amazonaws\.com\/[^\s"'<>)\]]+\.zip/gi;

function parseTrackFromUrl(rawUrl: string, postTitle: string): { artist: string; track: string } | null {
  const filename = decodeURIComponent(rawUrl.split("?")[0].split("/").pop()!)
    .replace(/\.zip$/i, "")
    .replace(/\+/g, " ")
    // Strip common noise
    .replace(/\s*TELEFUNKEN[''s]*\s*(?:Live\s*From\s*(?:The\s*)?Lab)?\s*/gi, "")
    .replace(/\s*(?:TFUNK\s*)?LFTL\s*/gi, "")
    .replace(/\s*\(LIVE\s*FROM\s*THE\s*LAB\)\s*/gi, "")
    .replace(/\s*(?:Full\s*)?(?:Audio\s*)?(?:Files?|Session)\s*/gi, "")
    .replace(/\s*multitrack\s*(?:audio\s*)?files?\s*/gi, "")
    .replace(/\s*24[:/]48\s*/gi, "")
    .replace(/^\d+\.\s*\+?\s*/, "") // numbered prefix e.g. "01. "
    .trim();

  // Try post title first when available — more reliable than acronym filenames
  const titleCleaned = postTitle
    .replace(/\s*[-–]\s*Telefunken\s+Elektroakustik\s*/gi, "")
    .replace(/\s*(?:TELEFUNKEN[''s]*\s*)?(?:"?Live\s*From\s*(?:The\s*)?(?:Lab|TELEFUNKEN\s*Soundstage)"?)\s*/gi, "")
    .replace(/\s*at\s+TELEFUNKEN\s*/gi, "")
    .replace(/\s*is\s+"?Live\s*From\s*the\s*Lab"?\s*/gi, "")
    .replace(/\s*Featured\s*at\s*TELEFUNKEN\s*/gi, "")
    .replace(/\s*Records\s*with\s*TELEFUNKEN.*$/gi, "")
    .replace(/\s*@\s+.+$/gi, "")
    .replace(/\s*[-–]\s*Multi-?Track\s+Session\s+Files?\s*(?:\(.*?\))?\s*/gi, "")
    .replace(/\s*[-–]\s*(?:Microphone\s+)?Comparison\s*/gi, "")
    .replace(/TF\d+\s*Multitrack\s*(?:Audio\s*)?Files?:\s*/gi, "")
    .replace(/&#8220;|&#8221;|[\u201C\u201D]/g, '"')
    .trim();

  const titleQuoteMatch = titleCleaned.match(/"([^"]+)"/);
  if (titleQuoteMatch) {
    const track = titleQuoteMatch[1];
    const artist = titleCleaned.replace(/"[^"]*"/, "").replace(/[&,\s]+$/, "").trim();
    if (artist && track) return { artist, track };
  }

  // Title has "Artist - Track" or "Artist – Track" pattern
  const titleDashMatch = titleCleaned.match(/^(.+?)\s*[-–]\s+(.+)$/);
  if (titleDashMatch) return { artist: titleDashMatch[1].trim(), track: titleDashMatch[2].trim() };

  // Fall back to parsing the zip filename
  // Pattern: Artist "Track"
  const quotedMatch = filename.match(/^(.+?)\s+"([^"]+)"\s*$/);
  if (quotedMatch) return { artist: quotedMatch[1].trim(), track: quotedMatch[2].trim() };

  // Pattern: Artist - Track
  const dashMatch = filename.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) return { artist: dashMatch[1].trim(), track: dashMatch[2].trim() };

  // Pattern: Artist_Track
  const underscoreIdx = filename.indexOf("_");
  if (underscoreIdx > 0) {
    return { artist: filename.slice(0, underscoreIdx).trim(), track: filename.slice(underscoreIdx + 1).trim() };
  }

  // Last resort: whole cleaned title as artist, filename as track
  if (titleCleaned && filename) return { artist: titleCleaned, track: filename };

  return null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/&#8220;|&#8221;|[\u201C\u201D]/g, '"')
    .replace(/&#[0-9]+;/g, c => String.fromCharCode(parseInt(c.slice(2, -1))));
}

async function fetchPageUrls(url: string, seenUrls: Set<string>, tracks: Track[]): Promise<boolean> {
  const html = await fetch(url).then(r => r.text()).catch(() => "");
  // Extract page title — only useful for single-track pages, not listing pages
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : "";
  // Count ALL S3 URLs on the page (not just unseen) to detect listing pages
  const allMatches = [...html.matchAll(S3_URL_REGEX)];
  const totalUrlsOnPage = new Set(allMatches.map(m => decodeHtmlEntities(m[0]).split("?")[0])).size;
  const newUrls: string[] = [];
  for (const decoded of new Set(allMatches.map(m => decodeHtmlEntities(m[0]).split("?")[0]))) {
    if (seenUrls.has(decoded)) continue;
    newUrls.push(decoded);
  }
  // Only use the page title for single-track pages (one URL total, not just one new)
  const pageTitle = totalUrlsOnPage === 1 ? rawTitle : "";
  let found = 0;
  for (const decoded of newUrls) {
    seenUrls.add(decoded);
    const parsed = parseTrackFromUrl(decoded, pageTitle);
    if (parsed) { tracks.push({ ...parsed, url: decoded, sourceUrl: url }); found++; }
    else console.warn(`  [warn] could not parse: ${decoded}`);
  }
  const hasNext = html.includes('rel="next"');
  if (found) console.log(`  [scrape] ${url} → ${found} new URLs`);
  return hasNext;
}

async function scrapeTrackList(): Promise<Track[]> {
  // Check cache
  if (existsSync(CACHE_FILE)) {
    const cache = JSON.parse(await Bun.file(CACHE_FILE).text());
    if (Date.now() - cache.ts < CACHE_TTL_MS) {
      console.log(`[scrape] using cached track list (${cache.tracks.length} tracks, expires in ${Math.round((CACHE_TTL_MS - (Date.now() - cache.ts)) / 3600000)}h)`);
      return cache.tracks;
    }
  }

  console.log("[scrape] fetching track list…");
  const tracks: Track[] = [];
  const seenUrls = new Set<string>();

  // Season pages — auto-discover new seasons until one returns empty
  for (let season = 1; ; season++) {
    let page = 1;
    let seasonHadAny = false;
    while (true) {
      const url = page === 1
        ? `https://www.telefunken-elektroakustik.com/livefromthelab_season/${season}/`
        : `https://www.telefunken-elektroakustik.com/livefromthelab_season/${season}/page/${page}/`;
      const before = tracks.length;
      const hasNext = await fetchPageUrls(url, seenUrls, tracks);
      if (tracks.length > before) seasonHadAny = true;
      if (!hasNext) break;
      page++;
    }
    if (!seasonHadAny && season > 9) break; // stop after confirmed empty season past the known range
  }

  // Main page (catches newest season before it gets a season number)
  await fetchPageUrls("https://www.telefunken-elektroakustik.com/livefromthelab/", seenUrls, tracks);

  // Standalone multitrack post pages
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://www.telefunken-elektroakustik.com/wp-json/wp/v2/multitrack?per_page=100&page=${page}&_fields=link`
    );
    if (!res.ok) break;
    const batch: any[] = await res.json();
    if (!batch.length) break;
    for (const p of batch) await fetchPageUrls(p.link, seenUrls, tracks);
    if (batch.length < 100) break;
    page++;
  }

  console.log(`[scrape] found ${tracks.length} downloadable tracks total`);
  await Bun.write(CACHE_FILE, JSON.stringify({ ts: Date.now(), tracks }, null, 2));
  return tracks;
}


function sanitizeName(name: string): string {
  return name.replace(/[\/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

function folderName(artist: string, track: string): string {
  return `${sanitizeName(artist)} - ${sanitizeName(track)}`;
}

// Normalized form for deduplication: lowercase, strip noise, remove punctuation,
// sort artist/track halves so swapped names still match.
function normalizeForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/live\s*from\s*the\s*lab/g, "")
    .replace(/telefunken/g, "")
    .split(/\s+-\s+/)
    .map(part => part.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .sort()
    .join("|");
}

// Levenshtein distance for fuzzy matching (typos, spelling variations)
function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Find existing folder matching by exact norm or fuzzy match (within 2 chars edit distance)
function findMatchingFolder(targetNorm: string, existingNormalized: Map<string, string>): string | null {
  if (existingNormalized.has(targetNorm)) return targetNorm;

  for (const [existingNorm] of existingNormalized) {
    if (levenshteinDistance(targetNorm, existingNorm) <= 2) return existingNorm;
  }
  return null;
}

async function convertToFlac(dir: string): Promise<void> {
  const glob = new Bun.Glob("**/*");
  const files = [...glob.scanSync({ cwd: dir, absolute: true })];

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(ext) || ext === ".flac") continue;

    const flacPath = file.slice(0, -ext.length) + ".flac";
    if (existsSync(flacPath)) {
      console.log(`    [skip] already flac: ${basename(flacPath)}`);
      continue;
    }

    console.log(`    [convert] ${basename(file)} → flac`);
    const result = await $`sox "${file}" "${flacPath}"`.quiet().nothrow();
    if (result.exitCode === 0) {
      await $`rm "${file}"`.quiet();
    } else {
      console.error(`    [error] sox failed on ${basename(file)}: ${result.stderr.toString()}`);
    }
  }
}

async function downloadRoughMaster(artist: string, track: string, destDir: string): Promise<void> {
  const roughMasterGlob = new Bun.Glob("rough master.*");
  const existing = [...roughMasterGlob.scanSync({ cwd: destDir })];
  if (existing.length > 0) {
    console.log(`    [skip] rough master already exists`);
    return;
  }

  const query = `${artist} ${track} Live From The Lab TELEFUNKEN`;
  console.log(`  [video] searching: ${query}`);

  const outTemplate = destDir + "/rough master.%(ext)s";
  const result = await $`yt-dlp https://www.youtube.com/@LiveFromTheLab/videos --match-title ${artist} --max-downloads 1 -f 140 -o ${outTemplate} --no-playlist --quiet --no-warnings --sleep-interval 5 --max-sleep-interval 15 --limit-rate 2M`.nothrow();

  if (result.exitCode !== 0 && result.exitCode !== 101) {
    // 101 = max-downloads reached after match, still success
    // Try fallback: yt-dlp search
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

async function processTrack(track: Track): Promise<void> {
  const folder = folderName(track.artist, track.track);
  const destDir = join(BASE_DIR, folder);

  if (existsSync(destDir)) {
    const flacGlob = new Bun.Glob("*.flac");
    const hasStems = [...flacGlob.scanSync({ cwd: destDir })].length > 0;
    if (!hasStems) {
      console.warn(`[warn] ${folder} exists but has no stems — download may have failed previously`);
      console.warn(`  Found at: ${track.sourceUrl}`);
    }
    await downloadRoughMaster(track.artist, track.track, destDir);
    return;
  }

  console.log(`[download] ${folder}`);
  mkdirSync(destDir, { recursive: true });

  const tmpZip = join(destDir, "_download.zip");

  const curlResult = await $`curl -f -L -s -o "${tmpZip}" "${track.url}"`.nothrow();
  if (curlResult.exitCode !== 0) {
    console.error(`  [error] download failed for ${folder}`);
    console.error(`    Found at: ${track.sourceUrl}`);
    await $`rm "${tmpZip}"`.quiet().nothrow();
    // Keep the folder so the script doesn't retry a broken URL on next run
    return;
  }

  // Verify the download is actually a zip file (not an HTML error page)
  const magic = await $`head -c 2 "${tmpZip}"`.quiet().nothrow().text();
  if (!magic.startsWith("PK")) {
    console.error(`  [error] download is not a valid zip for ${folder}`);
    console.error(`    Found at: ${track.sourceUrl}`);
    await $`rm "${tmpZip}"`.quiet();
    return;
  }

  console.log(`  [unzip] ${folder}`);
  const unzipResult = await $`unzip -q -o "${tmpZip}" -d "${destDir}"`.nothrow();
  await $`rm "${tmpZip}"`.quiet();
  // Remove Mac junk
  await $`find "${destDir}" -name "__MACOSX" -exec rm -rf {} + 2>/dev/null; find "${destDir}" -name "._*" -delete 2>/dev/null; find "${destDir}" -name ".DS_Store" -delete 2>/dev/null; true`.quiet();

  // Flatten single top-level subdirectory
  const topEntries = await $`ls -1A "${destDir}"`.quiet().text();
  const entries = topEntries.trim().split("\n").filter(Boolean);
  if (entries.length === 1) {
    const singleEntry = join(destDir, entries[0]);
    const stat = await $`test -d "${singleEntry}"`.nothrow();
    if (stat.exitCode === 0) {
      await $`mv "${singleEntry}"/* "${destDir}/" 2>/dev/null; mv "${singleEntry}"/.[!.]* "${destDir}/" 2>/dev/null; rmdir "${singleEntry}"; true`.quiet();
    }
  }

  if (unzipResult.exitCode !== 0) {
    console.error(`  [error] unzip failed for ${folder} (bad zip or dead URL)`);
    console.error(`    Found at: ${track.sourceUrl}`);
    // Keep the folder so the script doesn't retry on next run
    return;
  }

  console.log(`  [convert] converting audio to flac in ${folder}`);
  await convertToFlac(destDir);

  await downloadRoughMaster(track.artist, track.track, destDir);


  console.log(`  [done] ${folder}`);
}

const tracks = await scrapeTrackList();

// Build normalized map of existing folders to catch near-duplicate names (fuzzy match)
const existingEntries = (await $`ls -1 "${BASE_DIR}"`.quiet().nothrow().text())
  .trim().split("\n").filter(Boolean);
const existingNormalized = new Map(
  existingEntries.map(entry => [normalizeForComparison(entry), entry])
);

// Deduplicate tracks by normalized folder name (exact and fuzzy)
const seenNormalized = new Set<string>();
const uniqueTracks: Track[] = [];
for (const track of tracks) {
  const norm = normalizeForComparison(folderName(track.artist, track.track));
  const match = findMatchingFolder(norm, existingNormalized);
  if (match || seenNormalized.has(norm)) continue;
  seenNormalized.add(norm);
  uniqueTracks.push(track);
}

const skipped = tracks.length - uniqueTracks.length;
if (skipped > 0) console.log(`[dedup] skipped ${skipped} tracks already present (by normalized or fuzzy name)`);

// Process sequentially to avoid hammering the server
for (const track of uniqueTracks) {
  await processTrack(track);
}

console.log("\nAll done!");

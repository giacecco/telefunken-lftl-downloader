#!/usr/bin/env bun
// One-time script to backfill .telefunken metadata files in existing folders.
// Scrapes the track list, matches existing folders by fuzzy name, writes the S3 URL
// into a .telefunken file inside each matched folder. Does not download anything.

import { existsSync, readdirSync } from "fs";
import { join } from "path";

const BASE_DIR = process.argv[2];
if (!BASE_DIR || !existsSync(BASE_DIR)) {
  console.error("Usage: bun backfill-metadata.ts [/path/to/destination]");
  process.exit(1);
}

interface Track { artist: string; track: string; url: string; sourceUrl: string; }

const CACHE_FILE = "/tmp/telefunken-tracks-cache.json";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const S3_URL_REGEX = /https?:\/\/(?:season\d+multitracks|multitrackslive|multitracksstudio)\.s3(?:\.us-east-2)?\.amazonaws\.com\/[^\s"'<>)\]]+\.zip/gi;

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#8217;|&#039;/g, "'").replace(/&#8211;/g, "–")
    .replace(/&amp;/g, "&").replace(/&#8220;|&#8221;|[\u201C\u201D]/g, '"')
    .replace(/&#[0-9]+;/g, c => String.fromCharCode(parseInt(c.slice(2, -1))));
}

function parseTrackFromUrl(rawUrl: string, postTitle: string): { artist: string; track: string } | null {
  const filename = decodeURIComponent(rawUrl.split("?")[0].split("/").pop()!)
    .replace(/\.zip$/i, "").replace(/\+/g, " ")
    .replace(/\s*TELEFUNKEN[''s]*\s*(?:Live\s*From\s*(?:The\s*)?Lab)?\s*/gi, "")
    .replace(/\s*(?:TFUNK\s*)?LFTL\s*/gi, "")
    .replace(/\s*\(LIVE\s*FROM\s*THE\s*LAB\)\s*/gi, "")
    .replace(/\s*(?:Full\s*)?(?:Audio\s*)?(?:Files?|Session)\s*/gi, "")
    .replace(/\s*multitrack\s*(?:audio\s*)?files?\s*/gi, "")
    .replace(/\s*24[:/]48\s*/gi, "")
    .replace(/^\d+\.\s*\+?\s*/, "").trim();

  const titleCleaned = postTitle
    .replace(/\s*[-–]\s*Telefunken\s+Elektroakustik\s*/gi, "")
    .replace(/\s*(?:TELEFUNKEN[''s]*\s*)?(?:"?Live\s*From\s*(?:The\s*)?(?:Lab|TELEFUNKEN\s*Soundstage)"?)\s*/gi, "")
    .replace(/\s*at\s+TELEFUNKEN\s*/gi, "").replace(/\s*is\s+"?Live\s*From\s*the\s*Lab"?\s*/gi, "")
    .replace(/\s*Featured\s*at\s*TELEFUNKEN\s*/gi, "").replace(/\s*Records\s*with\s*TELEFUNKEN.*$/gi, "")
    .replace(/\s*@\s+.+$/gi, "").replace(/\s*[-–]\s*Multi-?Track\s+Session\s+Files?\s*(?:\(.*?\))?\s*/gi, "")
    .replace(/\s*[-–]\s*(?:Microphone\s+)?Comparison\s*/gi, "")
    .replace(/TF\d+\s*Multitrack\s*(?:Audio\s*)?Files?:\s*/gi, "")
    .replace(/&#8220;|&#8221;|[\u201C\u201D]/g, '"').trim();

  const titleQuoteMatch = titleCleaned.match(/"([^"]+)"/);
  if (titleQuoteMatch) {
    const track = titleQuoteMatch[1];
    const artist = titleCleaned.replace(/"[^"]*"/, "").replace(/[&,\s]+$/, "").trim();
    if (artist && track) return { artist, track };
  }
  const titleDashMatch = titleCleaned.match(/^(.+?)\s*[-–]\s+(.+)$/);
  if (titleDashMatch) return { artist: titleDashMatch[1].trim(), track: titleDashMatch[2].trim() };
  const quotedMatch = filename.match(/^(.+?)\s+"([^"]+)"\s*$/);
  if (quotedMatch) return { artist: quotedMatch[1].trim(), track: quotedMatch[2].trim() };
  const dashMatch = filename.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) return { artist: dashMatch[1].trim(), track: dashMatch[2].trim() };
  const underscoreIdx = filename.indexOf("_");
  if (underscoreIdx > 0) return { artist: filename.slice(0, underscoreIdx).trim(), track: filename.slice(underscoreIdx + 1).trim() };
  if (titleCleaned && filename) return { artist: titleCleaned, track: filename };
  return null;
}

async function fetchPageUrls(url: string, seenUrls: Set<string>, tracks: Track[]): Promise<boolean> {
  const html = await fetch(url).then(r => r.text()).catch(() => "");
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : "";
  const allMatches = [...html.matchAll(S3_URL_REGEX)];
  const totalUrlsOnPage = new Set(allMatches.map(m => decodeHtmlEntities(m[0]).split("?")[0])).size;
  const pageTitle = totalUrlsOnPage === 1 ? rawTitle : "";
  for (const decoded of new Set(allMatches.map(m => decodeHtmlEntities(m[0]).split("?")[0]))) {
    if (seenUrls.has(decoded)) continue;
    seenUrls.add(decoded);
    const parsed = parseTrackFromUrl(decoded, pageTitle);
    if (parsed) tracks.push({ ...parsed, url: decoded, sourceUrl: url });
  }
  return html.includes('rel="next"');
}

async function scrapeTrackList(): Promise<Track[]> {
  if (existsSync(CACHE_FILE)) {
    const cache = JSON.parse(await Bun.file(CACHE_FILE).text());
    if (Date.now() - cache.ts < CACHE_TTL_MS) {
      console.log(`[scrape] using cached track list (${cache.tracks.length} tracks)`);
      return cache.tracks;
    }
  }
  console.log("[scrape] fetching track list…");
  const tracks: Track[] = [];
  const seenUrls = new Set<string>();
  for (let season = 1; ; season++) {
    let page = 1, seasonHadAny = false;
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
    if (!seasonHadAny && season > 9) break;
  }
  await fetchPageUrls("https://www.telefunken-elektroakustik.com/livefromthelab/", seenUrls, tracks);
  let page = 1;
  while (true) {
    const res = await fetch(`https://www.telefunken-elektroakustik.com/wp-json/wp/v2/multitrack?per_page=100&page=${page}&_fields=link`);
    if (!res.ok) break;
    const batch: any[] = await res.json();
    if (!batch.length) break;
    for (const p of batch) await fetchPageUrls(p.link, seenUrls, tracks);
    if (batch.length < 100) break;
    page++;
  }
  console.log(`[scrape] found ${tracks.length} tracks`);
  await Bun.write(CACHE_FILE, JSON.stringify({ ts: Date.now(), tracks }, null, 2));
  return tracks;
}

function sanitizeName(name: string): string {
  return name.replace(/[\/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

function normalizeForComparison(name: string): string {
  return name.toLowerCase()
    .replace(/\(.*?\)/g, "").replace(/live\s*from\s*the\s*lab/g, "")
    .replace(/\blftl\b/g, "").replace(/\blflt\b/g, "")
    .replace(/telefunken/g, "")
    .split(/\s+-\s+/).map(part => part.replace(/[^a-z0-9]/g, "")).filter(Boolean).sort().join("|");
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

const tracks = await scrapeTrackList();
const existingEntries = readdirSync(BASE_DIR);
const existingNormalized = new Map(existingEntries.map(e => [normalizeForComparison(e), e]));

let written = 0, unmatched = 0;

for (const track of tracks) {
  const norm = normalizeForComparison(`${sanitizeName(track.artist)} - ${sanitizeName(track.track)}`);
  const metaByUrl = existingEntries.find(e => {
    const f = join(BASE_DIR, e, ".telefunken");
    return existsSync(f) && Bun.file(f).toString() === track.url;
  });
  if (metaByUrl) continue;

  // Find matching folder by exact or fuzzy norm
  let matchedEntry: string | null = null;
  if (existingNormalized.has(norm)) {
    matchedEntry = existingNormalized.get(norm)!;
  } else {
    for (const [existingNorm, entry] of existingNormalized) {
      if (levenshteinDistance(norm, existingNorm) <= 4) { matchedEntry = entry; break; }
    }
  }

  if (!matchedEntry) { unmatched++; continue; }

  const metaFile = join(BASE_DIR, matchedEntry, ".telefunken");
  if (!existsSync(metaFile)) {
    await Bun.write(metaFile, track.url);
    console.log(`[backfill] ${matchedEntry}`);
    written++;
  }
}

console.log(`\nDone. ${written} .telefunken files written, ${unmatched} tracks had no matching folder.`);

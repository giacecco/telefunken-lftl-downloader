# Telefunken Elektroakustik — Live From The Lab Downloader

## Source
https://www.telefunken-elektroakustik.com/livefromthelab/

## Destination
Passed as a required command-line argument. The directory must exist before running.

## Scripts

### `telefunken-download.ts`
Main script. For each track found on the Telefunken website:
- Creates `Artist - Track` folder
- Downloads the stems zip from AWS S3 (plain curl — no auth required)
- Extracts and converts audio to FLAC using `sox`
- Downloads the rough master from YouTube via `yt-dlp` (format 140 = m4a AAC audio-only)

Scraping strategy: iterates season pages (`/livefromthelab_season/N/`), the main listing page, and the `multitrack` custom post type via the WordPress REST API (`/wp-json/wp/v2/multitrack`). Caches the track list for 24h at `/tmp/telefunken-tracks-cache.json`.

## Legacy Scripts

- `legacy/telefunken-cleanup.ts` — removes Mac junk, flattens subfolders (optional maintenance)
- `legacy/telefunken-rough-masters.ts` — retries missing rough masters (optional recovery)
- `legacy/move_rough_masters.js` — one-time migration to move pre-downloaded YouTube files

## Prerequisites

```bash
brew install sox yt-dlp
```

## Running

```bash
bun telefunken-download.ts /path/to/destination
```

The destination directory must exist and be writable. The script will create `Artist - Track` subdirectories within it.

## Key Technical Notes

- **S3 URLs**: zips are hosted on `season\d+multitracks`, `multitrackslive`, or `multitracksstudio` S3 buckets. No authentication required.
- **URL regex**: `S3_URL_REGEX` matches all three bucket naming patterns. URLs are deduplicated by decoded base URL (no query string) before downloading.
- **Folder name parsing**: extracted from the zip filename after stripping TELEFUNKEN noise patterns. Falls back to the WordPress post title if the filename is ambiguous.
- **Rough masters**: YouTube format `140` = m4a AAC audio-only stream (~128 kbps). Primary strategy: `@LiveFromTheLab/videos` channel with `--match-title <artist>`. Fallback: `ytsearch1:<artist> <track> Live From The Lab TELEFUNKEN`.
- **yt-dlp rate limiting**: `--sleep-interval 5 --max-sleep-interval 15 --limit-rate 2M` avoids YouTube throttling.
- **Season discovery**: iterates season numbers until a season past 9 returns no URLs, to handle future seasons automatically.

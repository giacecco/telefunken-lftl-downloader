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
bun telefunken-download.ts [/path/to/destination] [--silent]
```

The destination directory must exist and be writable. The script will create `Artist - Track` subdirectories within it.

### Options

- `--silent`: Suppress all non-error output (`log()` and `warn()` calls). Only `console.error()` messages are shown. Useful for cron jobs where you only want email notifications on failure.

## Key Technical Notes

- **S3 URLs**: zips are hosted on `season\d+multitracks`, `multitrackslive`, or `multitracksstudio` S3 buckets. No authentication required.
- **URL regex**: `S3_URL_REGEX` matches all three bucket naming patterns. URLs are deduplicated by decoded base URL (no query string) before downloading.
- **Folder name parsing**: extracted from the zip filename after stripping TELEFUNKEN noise patterns. Falls back to the WordPress post title if the filename is ambiguous.
- **Rough masters**: YouTube format `140` = m4a AAC audio-only stream (~128 kbps). Primary strategy: `@LiveFromTheLab/videos` channel with `--match-title <artist>`. Fallback: `ytsearch1:<artist> <track> Live From The Lab TELEFUNKEN`.
- **yt-dlp rate limiting**: `--sleep-interval 5 --max-sleep-interval 15 --limit-rate 2M` avoids YouTube throttling.
- **Season discovery**: iterates season numbers until a season past 9 returns no URLs, to handle future seasons automatically.

## Production Deployment (ubuntu1)

Runs nightly on `ubuntu1` (Ubuntu, local network) via crontab:

```
MAILTO=giacecco@giacecco.com
0 20 * * * flock -n /tmp/telefunken.lock /home/giacecco/.bin/telefunken-cron-wrapper
```

### Wrapper script (`/home/giacecco/.bin/telefunken-cron-wrapper`)

Sleeps a random 0-4 hour delay, then runs the download script with the production destination:

```
/home/giacecco/.bun/bin/bun /home/giacecco/.bin/telefunken-lftl-downloader/telefunken-download.ts /mnt/iguanodon/music/multitracks/Telefunken\ Elektroakustik/ --silent
```

Key points:
- `flock` is only in the crontab line — do NOT put `flock` in the wrapper too (double-locking breaks it).
- `bun` path must be absolute (`/home/giacecco/.bun/bin/bun`) because cron has a minimal `$PATH`.
- `--silent` so `MAILTO` only triggers on `stderr` output (errors).
- `MAILTO` sends cron output/errors to giacecco@giacecco.com.
- The repo is cloned to `/home/giacecco/.bin/telefunken-lftl-downloader/`.

### Redeploy

The `redeploy` script (in this repo) does a fresh clone on ubuntu1:

```bash
#!/bin/bash
cd .. && rm -rf telefunken-lftl-downloader && gh repo clone giacecco/telefunken-lftl-downloader && cd telefunken-lftl-downloader
```

Run from the repo directory on ubuntu1. Requires `gh` CLI to be authenticated.

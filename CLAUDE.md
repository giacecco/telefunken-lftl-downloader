# Telefunken Elektroakustik — Live From The Lab Downloader

## Source
https://www.telefunken-elektroakustik.com/livefromthelab/

## Destination
`/Volumes/home/music/multitracks/Telefunken Elektroakustik`

## Scripts

### `telefunken-download.ts`
Main script. For each track found on the Telefunken website:
- Creates `Artist - Track` folder
- Downloads the stems zip from AWS S3 (plain curl — no auth required)
- Extracts and converts audio to FLAC using `sox`
- Downloads the rough master from YouTube via `yt-dlp` (format 140 = m4a AAC audio-only)
- Tags the folder green using the `tag` CLI

Scraping strategy: iterates season pages (`/livefromthelab_season/N/`), the main listing page, and the `multitrack` custom post type via the WordPress REST API (`/wp-json/wp/v2/multitrack`). Caches the track list for 24h at `/tmp/telefunken-tracks-cache.json`.

### `telefunken-cleanup.ts`
Removes macOS junk files (`.DS_Store`, `._*`) from all folders and flattens single top-level subdirectories inside each track folder.

### `telefunken-rough-masters.ts`
Standalone script to download missing rough masters for folders that don't yet have a `rough master.*` file. Uses the same `yt-dlp` channel-search + fallback strategy as the main script. Also deletes any stray `.m4a` files that aren't named `rough master.*`.

### `move_rough_masters.js`
One-time migration script used to move manually pre-downloaded YouTube m4a files from a `YouTube/` staging folder into the correct track folders, then tag each destination folder green.

## Prerequisites

```bash
brew install sox yt-dlp tag
```

## Running

```bash
bun telefunken-download.ts        # download new tracks (stems + rough masters)
bun telefunken-cleanup.ts         # remove Mac junk, flatten subfolders
bun telefunken-rough-masters.ts   # fill missing rough masters only
```

## Key Technical Notes

- **S3 URLs**: zips are hosted on `season\d+multitracks`, `multitrackslive`, or `multitracksstudio` S3 buckets. No authentication required.
- **URL regex**: `S3_URL_REGEX` matches all three bucket naming patterns. URLs are deduplicated by decoded base URL (no query string) before downloading.
- **Folder name parsing**: extracted from the zip filename after stripping TELEFUNKEN noise patterns. Falls back to the WordPress post title if the filename is ambiguous.
- **Rough masters**: YouTube format `140` = m4a AAC audio-only stream (~128 kbps). Primary strategy: `@LiveFromTheLab/videos` channel with `--match-title <artist>`. Fallback: `ytsearch1:<artist> <track> Live From The Lab TELEFUNKEN`.
- **yt-dlp rate limiting**: `--sleep-interval 5 --max-sleep-interval 15 --limit-rate 2M` avoids YouTube throttling.
- **Green tag**: uses the `tag` CLI (`tag --add Green <folder>`). Marks folders where the rough master has been successfully downloaded.
- **Season discovery**: iterates season numbers until a season past 9 returns no URLs, to handle future seasons automatically.

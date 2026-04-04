# Telefunken Elektroakustik — Live From The Lab Downloader

Scripts for downloading the free multitracks library from [Telefunken Elektroakustik's Live From The Lab](https://www.telefunken-elektroakustik.com/livefromthelab/) into a local collection.

## Requirements

- [Bun](https://bun.sh)
- `sox`: `brew install sox`
- `yt-dlp`: `brew install yt-dlp`
- `tag`: `brew install tag`

## Usage

Download all new tracks (stems + rough masters):

```bash
bun telefunken-download.ts
```

Fix folder structure after manual edits:

```bash
bun telefunken-cleanup.ts
```

Download missing rough masters only:

```bash
bun telefunken-rough-masters.ts
```

## What it does

- Scrapes all seasons of the Live From The Lab series plus standalone multitrack posts
- Downloads stems zips from AWS S3 (no auth required) and converts audio to FLAC
- Downloads the rough master audio from the [@LiveFromTheLab YouTube channel](https://www.youtube.com/@LiveFromTheLab) via `yt-dlp`
- Tags completed folders green using macOS file tags

## Output structure

```
/Volumes/home/music/multitracks/Telefunken Elektroakustik/
  Artist Name - Track Title/
    stem1.flac
    stem2.flac
    ...
    rough master.m4a
```

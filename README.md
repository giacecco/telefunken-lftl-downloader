# Telefunken Elektroakustik — Live From The Lab Downloader

## Why this exists

Telefunken Elektroakustik generously publishes free multitrack recordings from their Live From The Lab sessions. These are a remarkable resource for anyone learning to mix or studying recording techniques. But websites are ephemeral — they get redesigned, restructured, or taken offline without warning. These scripts exist to create a local backup of that library for preservation and personal use.

The irony is that the multitrack files already live on public, unauthenticated S3 buckets — the data is openly accessible. Yet discovering which files exist requires scraping WordPress pages, parsing inconsistent naming conventions, and piecing together artist and track names from noisy HTML. In an era where AI makes this kind of automation trivial, these obstacles achieve nothing except wasted effort. A simple JSON feed or download index would serve everyone better — listeners, archivists, and the publishers themselves.

---

Scripts for downloading the free multitracks library from [Telefunken Elektroakustik's Live From The Lab](https://www.telefunken-elektroakustik.com/livefromthelab/) into a local collection.

## Requirements

- [Bun](https://bun.sh)
- `sox`: `brew install sox`
- `yt-dlp`: `brew install yt-dlp`

## Usage

Download all new tracks (stems + rough masters):

```bash
bun telefunken-download.ts /path/to/destination
```

The destination directory must exist. Track folders will be created within it.

## What it does

- Scrapes all seasons of the Live From The Lab series plus standalone multitrack posts
- Downloads stems zips from AWS S3 (no auth required) and converts audio to FLAC
- Downloads the rough master audio from the [@LiveFromTheLab YouTube channel](https://www.youtube.com/@LiveFromTheLab) via `yt-dlp`

## Output structure

```
<destination>/
  Artist Name - Track Title/
    stem1.flac
    stem2.flac
    ...
    rough master.m4a
```

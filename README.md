# BKP 

A tool to archive my files.

Inspired and based on https://third-bit.com/sdxjs/file-backup/

## Pré-req

- Node 24.12.0 (lts)

## How to use it

```bash
$ npm install

$ node bkp.js <srcPath> <dstPath>
```

It will backup the files with the template name `<sha1>.bck` and a manifest `bkp-<timestamp>.csv`.
```
```

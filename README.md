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

It will backup the files with the template name `<dstPath>/<sha1>.bck` and will generate a manifest `<dstPath>/bkp-<timestamp>.csv`.

The files that already exists in the `dstPath` will be ignored.
```
```

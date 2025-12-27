import crypto from 'crypto'
import fs from 'fs-extra-promise'
import path from 'path'
import {glob} from 'glob'

function fileHash(type, filename) {
  const hash = crypto.createHash(type).setEncoding('hex')
  fs.createReadStream(filename).pipe(hash)
  hash.on('finish', () => {
    console.log(`SHA1 of ${filename} is ${hash.read()}`)
  })
}

const statPath = async (path) => {
  const stat = await fs.statAsync(path)
  console.log(`statPath: ${path}`)
  return [path, stat]
}

const readPath = async (path) => {
  // FIXME: What about binary files? how utf-8 encoding affects them?
  const content = await fs.readFileAsync(path, 'utf-8')
  console.log(`readPath: ${path}`)
  return [path, content]
}

const hashPath = (path, content) => {
  const hash = crypto.createHash('sha1').setEncoding('hex')
  hash.write(content)
  hash.end()
  const contentHash = hash.read()
  console.log(`hashPath: ${path}`)
  return [path, contentHash]
}

const hashExisting = async (rootDir) => {
  const pattern = `${rootDir}/**/*`
  const options = {}
  const matches = await glob(pattern, options)
  const stats = await Promise.all(
    matches.map(path => statPath(path))
  )
  const files = stats.filter(([path, stat]) => stat.isFile())
  const hashes = await Promise.all(
    files.map(
      async ([path, stat]) => {
        const [_, content] = await readPath(path)
        return hashPath(path, content)
      }
    )
  )
  // const hashes = contents.map(
  // ([path, content]) => hashPath(path, content)
  // )
  return hashes
}

const findNew = async (rootDir, pathHashPairs) => {
  const hashToPath = pathHashPairs.reduce(
    (idx, [path, hash]) => {
      idx[hash] = path
      return idx
    },
    {} // idx
  )

  const pattern = `${rootDir}/*.bck`
  const options = {}
  const existingFiles = await glob(pattern, options)

  existingFiles.forEach(existingFile => {
    const stripped = path.basename(existingFile).replace(/\.bck$/, '')
    const backupPath = hashToPath[stripped]
    if (backupPath !== null) {
      console.log(`WARN: Ignoring backup ${backupPath} bacause it is already backup as ${existingFile}`)
      delete hashToPath[stripped]
    }
  })

  return hashToPath
}

const copyFiles = async (dst, needToCopy) => {
  const promises = Object.keys(needToCopy).map(hash => {
    const srcPath = needToCopy[hash]
    const dstPath = `${dst}/${hash}.bck`
    console.log(`Backup ${srcPath} to ${dstPath}`)
    fs.copyFileAsync(srcPath, dstPath)
  })
  return Promise.all(promises)
}

const saveManifest = async (dst, timestamp, pathHashPairs) => {
  const pairs = pathHashPairs.sort()
  const content = pairs.map(
    ([path, hash]) => `${path},${hash}`
  ).join('\n')
  const manifest = `${dst}/bkp-${timestamp}.csv`
  fs.writeFileAsync(manifest, content, 'utf-8')
}

const backup = async (src, dst, timestamp = null) => {
  // TODO: Investigar qual a razao do timestamp
  if (timestamp === null) {
    timestamp = Math.round((new Date()).getTime() / 1000)
  }
  timestamp = String(timestamp).padStart(10, '0')

  const existing = await hashExisting(src)
  const needToCopy = await findNew(dst, existing)
  await copyFiles(dst, needToCopy)
  await saveManifest(dst, timestamp, existing)
}

const root = process.argv[2]
const target = process.argv[3]
backup(root, target)


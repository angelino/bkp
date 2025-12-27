import crypto from 'crypto'
import fs from 'fs-extra'
// FIXME: Where to find glob???
import glob from 'fast-glob'

function fileHash(type, filename) {
  const hash = crypto.createHash(type).setEncoding('hex')
  fs.createReadStream(filename).pipe(hash)
  hash.on('finish', () => {
    console.log(`SHA1 of ${filename} is ${hash.read()}`)
  })
}

const statPath = async (path) => {
  const stat = await fs.stat(path)
  return [path, stat]
}

const readPath = async (path) => {
  const content = await fs.readFile(path, 'utf-8')
  return [path, content]
}

const hashPath = (path, content) => {
  const hash = crypto.createHash('sha1').setEncoding('hex')
  hash.write(content)
  hash.end()
  return [path, hash.read()]
}

const hashExisting = async (rootDir) => {
  const pattern = `${rootDir}/**/*`
  const options = {}
  const matches = await glob(pattern, options)
  const stats = await Promise.all(matches.map(path => statPath(path)))
  const files = stats.filter(([path, stat]) => stat.isFile())
  const contents = await Promise.all(
    files.map(([path, stat]) => readPath(path))
  )
  const hashes = contents.map(
    ([path, content]) => hashPath(path, content)
  )
  return hashes
}

const root = process.argv[2]
hashExisting(root).then(
  pairs => pairs.forEach(([path, hash]) => console.log(path, hash))
)

console.log('DONE.')



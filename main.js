#!/usr/bin/env node
const fs = require("fs")
const columnify = require("columnify")
const imagemin = require("imagemin")
const imageminMozjpeg = require("imagemin-mozjpeg")
const imageminPngquant = require("imagemin-pngquant")
const imageminSvgo = require("imagemin-svgo")
const imageminWebp = require('imagemin-webp')
const filesize = require("filesize")
const yargs = require("yargs")

const argv = yargs
  .usage("oimg [flags] file...")
  .default("webp", false)
  .describe("webp", "whether or not to convert jpgs and pngs to webp")
  .default("output", "dist")
  .default("jpg-quality", 70)
  .default("png-quality", "0.65,0.8")
  .default("webp-jpg-quality", 75)
  .default("webp-png-quality", 85)
  .alias("h", "help")
  .alias("v", "version")
  .argv

const getSize = filePath => fs.statSync(filePath).size
const isJPG = filename => filename.endsWith(".jpg") || filename.endsWith(".jpeg")
const isPNG = filename => filename.endsWith(".png")
const calcPercent = (src, dst) => (Math.abs(dst - src) / src * 100).toFixed(2)

// result: [{source, compressed, webp}]
const printResult = result => {
  const output = result.map(item => {
    const originalSize = getSize(item.source)
    const compressedSize = getSize(item.compressed)

    const result = {
      "Original Path": item.source,
      "Compressed Path": item.compressed,
      "Original Size": filesize(originalSize),
      "Compressed Size": filesize(compressedSize),
      "Compressed %": calcPercent(originalSize, compressedSize)
    }

    if(argv.webp && item.webp) {
      const webpSize = getSize(item.webp)
      result["WebP Path"] = item.webp
      result["WebP Size"] = filesize(webpSize)
      result["WebP %"] = calcPercent(originalSize, webpSize)
    }

    return result
  })

  console.log(columnify(output, {
    columnSplitter: " | ",
    align: "center",
  }))
}

;(async () => {
  if(argv._.length === 0) {
    yargs.showHelp()
    process.exit(1)
  }

  const pngQuality = []
  argv["png-quality"].split(",").forEach(str => {
    if(isNaN(parseFloat(str))) {
      console.error(`could not parse --png-quality: ${ argv["png-quality"] }`)
      process.exit(1)
    }
    pngQuality.push(parseFloat(str))
  })

  const compressed = await imagemin(argv._, {
    destination: argv.output,
    plugins: [
      imageminMozjpeg({
        quality: argv["jpg-quality"],
      }),
      imageminPngquant({
        quality: pngQuality,
      }),
      imageminSvgo({
        plugins: [
          {removeViewBox: false},
        ],
      }),
    ],
  })

  const result = compressed.map(i => ({
    source: i.sourcePath,
    compressed: i.destinationPath,
  }))

  if(argv.webp) {
    const jpgs = compressed
      .map(r => r.destinationPath)
      .filter(isJPG)

    const jpgWebps = await imagemin(jpgs, {
      destination: argv.output,
      plugins: [
        imageminWebp({
          quality: argv["webp-jpg-quality"],
        }),
      ],
    })

    jpgWebps.forEach(j => {
      const item = result.find(r => r.compressed === j.sourcePath)
      item.webp = j.destinationPath
    })

    const pngs = compressed
      .map(r => r.destinationPath)
      .filter(isPNG)

    const pngWebps = await imagemin(pngs, {
      destination: argv.output,
      plugins: [
        imageminWebp({
          quality: argv["webp-png-quality"],
        }),
      ],
    })

    pngWebps.forEach(p => {
      const item = result.find(r => r.compressed === p.sourcePath)
      item.webp = p.destinationPath
    })
  }

  printResult(result)
})()

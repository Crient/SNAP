#!/usr/bin/env node
/**
 * Generate lightweight WebP thumbnails for elements, scenes, and patterns.
 * Thumbs are written to /thumbs subfolders and do not overwrite originals.
 */

import fs from 'fs'
import path from 'path'
import process from 'process'

const sharp = await import('sharp')

const root = path.join(process.cwd(), 'public', 'assets')
const targets = [
  {
    label: 'elements',
    inputDir: path.join(root, 'elements'),
    outputDir: path.join(root, 'elements', 'thumbs'),
    pattern: /^el_(\d{3})\.png$/i,
    size: 320,
  },
  {
    label: 'scenes',
    inputDir: path.join(root, 'backgrounds', 'scenes'),
    outputDir: path.join(root, 'backgrounds', 'scenes', 'thumbs'),
    pattern: /^bgs_(\d{3})\.png$/i,
    size: 400,
  },
  {
    label: 'patterns',
    inputDir: path.join(root, 'backgrounds', 'patterns'),
    outputDir: path.join(root, 'backgrounds', 'patterns', 'thumbs'),
    pattern: /^bgp_(\d{3})\.png$/i,
    size: 320,
  },
]

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true })
}

async function makeThumb(inputPath, outputPath, size) {
  await sharp.default(inputPath)
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outputPath)
}

async function run() {
  for (const target of targets) {
    const { label, inputDir, outputDir, pattern, size } = target
    await ensureDir(outputDir)

    const files = (await fs.promises.readdir(inputDir))
      .filter(f => pattern.test(f))

    console.log(`\nGenerating thumbs for ${label}...`)

    for (const file of files) {
      const base = file.replace('.png', '.webp')
      const inputPath = path.join(inputDir, file)
      const outputPath = path.join(outputDir, base)

      try {
        await makeThumb(inputPath, outputPath, size)
        console.log(`  ✓ ${file} -> thumbs/${base}`)
      } catch (err) {
        console.error(`  ✕ ${file}: ${err.message}`)
      }
    }
  }

  console.log('\nDone.')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

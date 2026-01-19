#!/usr/bin/env node

/**
 * Image Compression Script
 * Run this once to compress all your background and element images
 * 
 * Usage: 
 *   1. npm install sharp (if not already installed)
 *   2. node scripts/compress-images.js
 * 
 * This will create optimized versions of all images
 */

import fs from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

async function compressImages() {
  // Check if sharp is installed
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch (err) {
    console.log('❌ Sharp is not installed. Installing now...')
    console.log('\nRun this command first:')
    console.log('  npm install sharp --save-dev\n')
    console.log('Then run this script again:')
    console.log('  node scripts/compress-images.js\n')
    console.log(`Missing dependency error: ${err.message}`)
    process.exit(1)
  }

  const directories = [
    { 
      input: path.join(rootDir, 'public/assets/backgrounds/scenes'),
      type: 'scene'
    },
    { 
      input: path.join(rootDir, 'public/assets/backgrounds/patterns'),
      type: 'pattern'
    },
    { 
      input: path.join(rootDir, 'public/assets/elements'),
      type: 'element'
    }
  ]

  let totalSaved = 0

  for (const dir of directories) {
    if (!fs.existsSync(dir.input)) {
      console.log(`⚠️  Directory not found: ${dir.input}`)
      continue
    }

    console.log(`\n📁 Processing ${dir.type}s...`)
    
    const files = fs.readdirSync(dir.input).filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    
    for (const file of files) {
      const inputPath = path.join(dir.input, file)
      const stats = fs.statSync(inputPath)
      const originalSize = stats.size
      
      // Skip if already small (under 500KB)
      if (originalSize < 500 * 1024) {
        console.log(`  ✓ ${file} - already optimized (${(originalSize / 1024).toFixed(0)}KB)`)
        continue
      }
      
      try {
        // Create backup
        const backupPath = inputPath + '.backup'
        if (!fs.existsSync(backupPath)) {
          fs.copyFileSync(inputPath, backupPath)
        }
        
        // Compress based on type
        let quality = 80
        let maxWidth = 1920
        let maxHeight = 1920
        
        if (dir.type === 'element') {
          maxWidth = 512
          maxHeight = 512
          quality = 85
        } else if (dir.type === 'pattern') {
          maxWidth = 512
          maxHeight = 512
          quality = 85
        } else {
          // Scenes - larger but still compressed
          maxWidth = 1920
          maxHeight = 1920
          quality = 75
        }
        
        // Process image
        const image = sharp(inputPath)
        const metadata = await image.metadata()
        
        // Resize if too large
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          image.resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
        }
        
        // Save as optimized PNG (keeps transparency)
        await image
          .png({ quality, compressionLevel: 9 })
          .toFile(inputPath + '.tmp')
        
        // Replace original
        fs.unlinkSync(inputPath)
        fs.renameSync(inputPath + '.tmp', inputPath)
        
        const newStats = fs.statSync(inputPath)
        const newSize = newStats.size
        const saved = originalSize - newSize
        totalSaved += saved
        
        console.log(`  ✓ ${file}: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(newSize / 1024 / 1024).toFixed(1)}MB (saved ${(saved / 1024 / 1024).toFixed(1)}MB)`)
        
      } catch (err) {
        console.log(`  ❌ ${file}: Error - ${err.message}`)
      }
    }
  }

  console.log(`\n🎉 Done! Total saved: ${(totalSaved / 1024 / 1024).toFixed(1)}MB`)
  console.log('\nBackups were created with .backup extension.')
  console.log('If everything works, you can delete them with:')
  console.log('  find public/assets -name "*.backup" -delete\n')
}

compressImages().catch(console.error)

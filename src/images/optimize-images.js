// 图片优化脚本
// 使用 sharp.js 进行图片压缩和格式转换

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const images = [
  { name: 'spring-bg.jpg', quality: 70, width: 1920 },
  { name: 'summer-bg.jpg', quality: 70, width: 1920 },
  { name: 'autumn-bg.jpg', quality: 70, width: 1920 },
  { name: 'winter-body.jpg', quality: 70, width: 300 }, // 保持小尺寸重复
  { name: 'winter-top.jpg', quality: 70, width: 1920 }
];

async function optimizeImages() {
  const inputDir = './';
  const outputDir = './optimized';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (const image of images) {
    const inputPath = path.join(inputDir, image.name);
    const outputPath = path.join(outputDir, image.name);
    
    try {
      await sharp(inputPath)
        .resize(image.width, null, { 
          withoutEnlargement: true,
          fit: 'cover'
        })
        .jpeg({ 
          quality: image.quality,
          progressive: true 
        })
        .toFile(outputPath);
      
      console.log(`✅ ${image.name} optimized`);
    } catch (error) {
      console.error(`❌ Error optimizing ${image.name}:`, error);
    }
  }
}

// 生成 WebP 版本
async function generateWebP() {
  const inputDir = './';
  const outputDir = './webp';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (const image of images) {
    const inputPath = path.join(inputDir, image.name);
    const outputPath = path.join(outputDir, image.name.replace('.jpg', '.webp'));
    
    try {
      await sharp(inputPath)
        .resize(image.width, null, { 
          withoutEnlargement: true,
          fit: 'cover'
        })
        .webp({ 
          quality: 65,
          effort: 6 
        })
        .toFile(outputPath);
      
      console.log(`✅ ${image.name} WebP generated`);
    } catch (error) {
      console.error(`❌ Error generating WebP for ${image.name}:`, error);
    }
  }
}

optimizeImages().then(() => generateWebP());

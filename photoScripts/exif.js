const fs = require('fs').promises;
const path = require('path');
const exifr = require('exifr');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// 支持的图片格式列表
const supportedFormats = new Set(['.jpg', '.jpeg', '.png', '.tiff', '.webp', '.heic']);

// 从图片中提取EXIF信息
async function extractExif(filePath) {
  try {
    const exif = await exifr.parse(filePath);
    if (exif && exif.latitude) {
      const dateTimeStamp = exif.DateTimeOriginal ? 
      Math.floor(new Date(exif.DateTimeOriginal).getTime() / 1000) : 
      Math.floor(new Date(exif.CreateDate).getTime() / 1000);
      return {
        dateTime: dateTimeStamp,
        locType: 1, // 假定值
        longitude: exif.longitude,
        latitude: exif.latitude,
        heading: exif.GPSImgDirection || 0, // 方向/航向
        accuracy: exif.GPSHPositioningError || 0,
        speed: exif.GPSSpeed || 0,
        distance: 0, // EXIF信息通常不包含距离
        isBackForeground: 0, // 假定值
        stepType: 0, // 假定值
        altitude: exif.GPSAltitude || 0
      };
    }
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
  }
  return null;
}

// 递归遍历目录
async function walkDir(dirPath, callback) {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  for (let file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      await walkDir(fullPath, callback); // 递归遍历子目录
    } else if (supportedFormats.has(path.extname(file.name).toLowerCase())) {
      await callback(fullPath); // 执行回调处理文件
    }
  }
}

// 主函数
async function processImages(dirPath, csvFilePath) {
  const exifDataList = [];

  // 提取并累积EXIF信息的回调函数
  async function handleFile(filePath) {
    const exifData = await extractExif(filePath);
    if (exifData) {
      exifDataList.push(exifData);
    }
  }

  // 遍历目录并处理每个文件
  await walkDir(dirPath, handleFile);

  // 将所有收集到的EXIF信息写入CSV
  const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: [
      { id: 'dateTime', title: 'dateTime' },
      { id: 'locType', title: 'locType' },
      { id: 'longitude', title: 'longitude' },
      { id: 'latitude', title: 'latitude' },
      { id: 'heading', title: 'heading' },
      { id: 'accuracy', title: 'accuracy' },
      { id: 'speed', title: 'speed' },
      { id: 'distance', title: 'distance' },
      { id: 'isBackForeground', title: 'isBackForeground' },
      { id: 'stepType', title: 'stepType' },
      { id: 'altitude', title: 'altitude' },
    ]
  });

  await csvWriter.writeRecords(exifDataList);
}

// 使用示例
const imagesDirPath = '/mnt/photo/手机相册'; // 替换为你的图片目录路径
const outputCsvPath = './output.csv'; // 替换为你想要写入CSV文件的路径
processImages(imagesDirPath, outputCsvPath).then(() => {
  console.log('EXIF data has been written to CSV.');
}).catch(console.error);


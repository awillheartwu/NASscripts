import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// 检查文件是否为图片文件
async function isImageFile(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  const extname = path.extname(filePath).toLowerCase();
  return imageExtensions.includes(extname);
}

// 检查文件夹是否包含压缩包文件
async function containsZipFiles(folderPath) {
  const files = await readdir(folderPath);
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileStat = await stat(filePath);
    if (fileStat.isFile() && file.endsWith('.zip')) {
      return true;
    }
  }
  return false;
}

// 创建压缩文件
async function createZipFile(imageFiles, folderPath, folderName) {
  const outputZipPath = path.join(folderPath, `${folderName}.zip`);
  const output = fs.createWriteStream(outputZipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  for (const imageFile of imageFiles) {
    const imageName = path.basename(imageFile);
    archive.file(imageFile, { name: imageName });
  }

  await archive.finalize();
  console.log(`Created ${folderName}.zip in ${folderPath}`);
}

// 递归处理文件夹及其内容
async function processFolderRecursively(folderPath) {
  const folderName = path.basename(folderPath);
  console.log('♿️ - file: zip.mjs:49 - processFolderRecursively - folderName:', folderName);

  // 读取文件夹中的文件和子文件夹
  const files = await readdir(folderPath);
  const imageFiles = [];

  // 遍历文件和子文件夹
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileStat = await stat(filePath);

    if (fileStat.isFile() && isImageFile(filePath)) {
      console.log('file');
      imageFiles.push(filePath);
    } else if (fileStat.isDirectory()) {
      console.log('directory');
      // 如果是文件夹，递归处理该文件夹
      await processFolderRecursively(filePath); // 将递归调用移到这里
    }
  }

  // 如果有图片文件且文件夹不包含压缩包文件，创建压缩文件
  console.log('imageFiles.length:', imageFiles.length);
  console.log('await containsZipFiles(folderPath):', await containsZipFiles(folderPath));
  if (imageFiles.length > 0 && !await containsZipFiles(folderPath)) {
    await createZipFile(imageFiles, folderPath, folderName);
  }
}

// 主函数
async function main() {
  const inputFolder = process.argv[2];
  console.log('♿️ - file: zip.mjs:76 - main - inputFolder:', inputFolder);

  if (!inputFolder) {
    console.error('Usage: node script.mjs <input_folder>');
    process.exit(1);
  }

  try {
    await processFolderRecursively(inputFolder);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();

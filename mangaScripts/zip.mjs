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

// 创建压缩文件
async function createZipFile(imageFiles, folderPath, folderName) {
  try {
    const outputZipPath = path.join(folderPath, `${folderName}.zip`);
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    for (const imageFile of imageFiles) {
      const imageName = path.basename(imageFile);
      archive.file(imageFile, { name: imageName });
    }

    // 不需要等待 archive.file，直接调用 finalize
    archive.finalize();

    // 等待 finalize 完成
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
    });

    console.log(`Created ${folderName}.zip in ${folderPath}`);
  } catch (err) {
    console.error('Error creating zip file:', err);
  }
}

// 递归处理文件夹及其内容
async function processFolderRecursively(folderPath) {
  const folderName = path.basename(folderPath);

  // 读取文件夹中的文件和子文件夹
  const files = await readdir(folderPath);
  const imageFiles = [];
  const notImageFolders = [];

  // 遍历文件和子文件夹
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileStat = await stat(filePath);

    if (fileStat.isFile() && isImageFile(filePath)) {
      imageFiles.push(filePath);
    } else if (fileStat.isDirectory()) {
      notImageFolders.push(folderPath);
      // 如果是文件夹，递归处理该文件夹
      await processFolderRecursively(filePath);
    }
  }

  // 判断是否需要创建 zip
  if (imageFiles.length > 0 && !notImageFolders.includes(folderPath)) {
    // 检查上一层目录是否已经有 zip 文件
    const parentFolder = path.dirname(folderPath);
    // const parentFolderName = path.basename(parentFolder);
    const parentZipExists = fs.existsSync(path.join(parentFolder, `${folderName}.zip`));
    
    if (!parentZipExists) {
      // 如果上一层没有对应的 zip 文件，创建到上层目录下
      await createZipFile(imageFiles, parentFolder, folderName);
    }
  }
}

// 主函数
async function main() {
  const inputFolder = process.argv[2];

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

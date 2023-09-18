import fs from 'fs/promises';
import path from 'path';

// 检查文件夹是否包含超过一个压缩包文件
async function containsMultipleZipFiles(folderPath) {
  const files = await fs.readdir(folderPath);
  let zipCount = 0;

  const zipRegex = /\.(zip|rar)$/i; // 匹配.zip和.rar扩展名，不区分大小写

  for (const file of files) {
    if (zipRegex.test(file)) {
      zipCount++;
      if (zipCount > 1) {
        return true;
      }
    }
  }

  return false;
}

// 检查文件夹是否包含图片文件
async function containsImageFiles(folderPath) {
  const files = await fs.readdir(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileStat = await fs.stat(filePath);

    if (fileStat.isFile() && isImageFile(filePath)) {
      return true;
    }
  }

  return false;
}

// 检查文件是否为图片文件
function isImageFile(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  const extname = path.extname(filePath).toLowerCase();
  return imageExtensions.includes(extname);
}

// 创建文件夹并将压缩包移动到文件夹中
async function createFoldersAndMoveZipFiles(folderPath) {
  const files = await fs.readdir(folderPath);

  const zipFiles = files.filter((file) => {
    const filePath = path.join(folderPath, file);
    return /\.(zip|rar)$/i.test(filePath); // 匹配.zip和.rar扩展名，不区分大小写
  });

  for (const zipFile of zipFiles) {
    const zipFileName = path.basename(zipFile, path.extname(zipFile));
    const newFolderPath = path.join(folderPath, zipFileName);

    // 创建新文件夹
    await fs.mkdir(newFolderPath);

    // 移动压缩包到新文件夹中
    await fs.rename(path.join(folderPath, zipFile), path.join(newFolderPath, zipFile));
    console.log(`Moved ${zipFile} to ${newFolderPath}`);
  }
}

// 递归处理文件夹及其内容
async function processFolderRecursively(folderPath) {
  if (await containsMultipleZipFiles(folderPath) && !await containsImageFiles(folderPath)) {
    await createFoldersAndMoveZipFiles(folderPath);
  }

  const subFolders = await fs.readdir(folderPath);

  for (const subFolder of subFolders) {
    const subFolderPath = path.join(folderPath, subFolder);
    const subFolderStat = await fs.stat(subFolderPath);

    if (subFolderStat.isDirectory()) {
      await processFolderRecursively(subFolderPath);
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
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();

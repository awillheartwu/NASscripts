import * as fs from 'fs';
import * as path from 'path';

// 新的目录结构的根路径
const newPath = '/mnt/d/09_temps/99_extra/mp3_2';

// 原始目录结构的根路径
const originalPath = '/mnt/d/09_temps/99_extra/mp3_3';

// 遍历新的目录结构
async function traverseAndMove(dirPath) {
  try {
    const items = await fs.promises.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.promises.stat(itemPath);

      if (stats.isFile()) {
        // 如果是文件，构建原始文件的完整路径，保持相同的相对路径
        const relativePath = path.relative(newPath, itemPath);
        const originalFilePath = path.join(originalPath, relativePath);

        // 将文件移回原始位置
        await fs.promises.rename(itemPath, originalFilePath);
        console.log(`Moved: ${itemPath} => ${originalFilePath}`);
      } else if (stats.isDirectory()) {
        // 如果是目录，递归遍历子目录
        await traverseAndMove(itemPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory: ${dirPath}`, error);
  }
}

// 开始遍历并逆向操作
traverseAndMove(newPath)
  .then(() => {
    console.log('Reverse operation completed successfully.');
  })
  .catch((err) => {
    console.error(err);
  });

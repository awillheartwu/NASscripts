import * as fs from 'fs';
import * as path from 'path';
import * as mm from 'music-metadata';

// 输入路径
const inputPath = '/mnt/d/09_temps/99_extra/new';

// 遍历输入路径下的所有文件
fs.promises.readdir(inputPath)
  .then((files) => {
    // 使用 Promise.all 遍历每个文件
    return Promise.all(files.map(async (file) => {
      const filePath = path.join(inputPath, file);

      try {
        // 使用 fs.promises.stat 获取文件状态
        const stats = await fs.promises.stat(filePath);

        // 检查文件是否为文件而不是目录
        if (stats.isFile() && filePath.endsWith('.flac')) {
          // 使用 music-metadata 模块获取 flac 文件的元数据
          const metadata = await mm.parseFile(filePath);

          // 从元数据中提取艺术家、专辑和曲目信息
          const artist = (metadata.common.artist || 'Unknown Artist')
            .replace(/\//g, '&') // 将斜杠替换为&
            .replace(/'/g, '')   // 删除单引号
            .replace(/\./g, '');  // 删除句点

          const album = metadata.common.album || 'Unknown Album';
          const trackNo = metadata.common.track.no || 0; // 默认为0
          const title = metadata.common.title || 'Unknown Track';

          // 格式化音轨号为两位数，添加前导零
          // const formattedTrackNo = String(trackNo).padStart(2, '0');

          // 构建目标文件名
          // const destFileName = `${formattedTrackNo} - ${title}.flac`;
          const destFileName = file;


          // 构建目标文件夹路径
          const destDir = path.join('/mnt/d/09_temps/99_extra/new', artist, album);

          // 确保目标文件夹存在
          await fs.promises.mkdir(destDir, { recursive: true });

          // 构建目标文件的完整路径
          const destPath = path.join(destDir, destFileName);

          // 将文件移动到目标位置
          await fs.promises.rename(filePath, destPath);
          console.log(`Moved: ${file} => ${destPath}`);
        } else {
          console.log(`Skipped: ${file} (not a flac file)`);
        }
      } catch (error) {
        console.error(`Error processing file: ${file}`, error);
      }
    }));
  })
  .catch((err) => {
    console.error(err);
  });



import * as fs from 'fs';
import * as path from 'path';
import * as mm from 'music-metadata';
import util from 'util';

const readdir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);

// 输入文件夹路径和输出日志文件路径
const inputFolder = '/mnt/d/09_temps/99_extra/mp3';
const logFilePath = '/mnt/d/09_temps/99_extra/mp3/log.txt';

function extractInfoFromFileName(fileName) {
  // 使用正则表达式从文件名中提取艺术家和歌曲名信息
  const match = fileName.match(/^(.*) - (.*)\.mp3$/);

  if (match) {
    const artist = match[1];
    const songTitle = match[2];
    return `${songTitle} - ${artist}`;
  } else {
    return 'Unknown';
  }
}

async function getMp3Tags() {
  try {
    // 读取输入文件夹下的所有文件
    const files = await fs.promises.readdir(inputFolder);

    // 过滤出MP3文件
    const mp3Files = files.filter((file) => file.endsWith('.mp3'));

    // 提取信息并写入日志文件
    const tagInfo = mp3Files.map((mp3File) => {
      return extractInfoFromFileName(mp3File);
    });

    // 将信息写入日志文件
    await fs.promises.writeFile(logFilePath, tagInfo.join('\n'), 'utf-8');

    console.log(`MP3 information extracted and saved to ${logFilePath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

getMp3Tags();
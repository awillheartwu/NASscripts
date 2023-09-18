const fs = require('fs');
const { exec } = require('child_process');
const playdl = require('play-dl');

// 读取日志文件，每行都是 "歌曲名 - 艺术家"
const logFilePath = '/mnt/d/09_temps/99_extra/mp3/log.txt';
const searchResults = fs.readFileSync(logFilePath, 'utf-8').split('\n');
console.log(searchResults);

// 收集下载的音乐的URL
const downloadedUrls = [];

// 迭代每个搜索结果并下载
async function download() {
  for (const searchQuery of searchResults) {
    try {
      // 使用 play-dl 在 Deezer 上搜索音乐
      const searchOptions = {
        limit: 1, // 限制搜索结果为1个
        artist: searchQuery.split(' - ')[1], // 搜索结果的艺术家必须与日志文件中的艺术家匹配
        title: searchQuery.split(' - ')[0], // 搜索结果的曲目必须与日志文件中的曲目匹配
      };
      const tracks = await playdl.dz_advanced_track_search(searchOptions);

      if (tracks && tracks.length > 0) {
        // 选择搜索结果的第一个曲目
        const track = tracks[0];

        // 将音乐的URL添加到已下载的URL列表中
        downloadedUrls.push(track.url);

        // 延迟5秒，以避免被Deezer封禁
        setTimeout(() => {}, 5000);

        // // 使用 rip 命令行下载曲目
        // const ripCommand = `rip url --max-quality 3 ${track.url}`;
        // exec(ripCommand, (error, stdout, stderr) => {
        //   if (error) {
        //     console.error(`Error downloading: ${track.title} - ${track.artist}`, error);
        //   } else {
        //     console.log(`Downloaded: ${track.title} - ${track.artist}`);
        //   }
        // });
      } else {
        console.log(`No results found for: ${searchQuery}`);
      }
    } catch (error) {
      console.error(`Error searching for: ${searchQuery}`, error);
    }
  };

  // 将已下载的URL列表写入文件
  const urlsFilePath = '/mnt/d/09_temps/99_extra/mp3/downloaded_urls.txt';
  fs.writeFileSync(urlsFilePath, downloadedUrls.join('\n'), 'utf-8');
  console.log(`Downloaded URLs saved to: ${urlsFilePath}`);
}

download();

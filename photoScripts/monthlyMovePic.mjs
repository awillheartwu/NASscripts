import exifr from 'exifr';
import fs from 'fs-extra';
import path from 'path';
import dayjs from 'dayjs';

// 支持的图片格式列表
const supportedFormats = new Set(['.jpg', '.jpeg', '.png', '.tiff', '.webp', '.heic', '.gif']);

// 忽略的目录列表
const ignoredDirectories = new Set(['@eaDir', '#snapshot', '#recycle', '@tmp', '@SynoFinder-log', '@sharesnap']);

// 获取当前年份和月份
const now = new Date();
const year = dayjs(now).format('YYYY');
const month = dayjs(now).format('MM');

// 定义源目录和目标目录
const sourceDirInput = process.argv[2];
const targetDirInput = process.argv[3];
const sourceDir = path.join(sourceDirInput ?? '/mnt/photo/手机相册', year, month);
const targetDir = path.join(targetDirInput ?? '/mnt/photo/截图相册/02_phone', year, month);
console.log(`Source directory: ${sourceDir}`);
console.log(`Target directory: ${targetDir}`);

// 创建目标目录（如果不存在）
fs.ensureDirSync(sourceDir);
fs.ensureDirSync(targetDir);

// 从图片中提取EXIF信息
async function extractExif(filePath) {
    try {
        const exif = await exifr.parse(filePath);
        return exif;
    } catch (error) {
        console.error('Error extracting EXIF data:', error);
        return null;
    }
}

// 迁移文件
async function moveFile(filePath, targetPath) {
    try {
        await fs.move(filePath, targetPath, { overwrite: true });
        console.log(`Moved ${filePath} to ${targetPath}`);
    } catch (error) {
        console.error(`Error moving file ${filePath}:`, error);
    }
}

// 递归遍历目录
async function walkDir(dirPath, callback) {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (let file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        // 忽略特定目录
        if (file.isDirectory() && (ignoredDirectories.has(file.name) || file.name.startsWith('@'))) {
            continue;
        }

        if (file.isDirectory()) {
            await walkDir(fullPath, callback); // 递归遍历子目录
        } else if (supportedFormats.has(path.extname(file.name).toLowerCase())) {
            await callback(fullPath); // 执行回调处理文件
        }
    }
}

// 处理图片
async function processImages(dirPath) {
    await walkDir(dirPath, async (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const isGif = ext === '.gif';
        const isHeic = ext === '.heic';

        let exif = null;
        if (!isGif) {
            exif = await extractExif(filePath);
        }

        // 判断是否是截屏或网络图片或GIF图片,或者文件格式是非视频且格式不是heic
        const isScreenshot = exif && exif.userComment && exif.userComment.includes('Screenshot');
        const isNetworkImage = !exif || (exif && !exif.Make && !exif.Model);
        const isNotHeicAndNotVideo = !isHeic && !(ext === '.mp4' || ext === '.mov');

        if (isScreenshot || isNetworkImage || isGif || isNotHeicAndNotVideo) {
            const targetPath = path.join(targetDir, path.basename(filePath));
            await moveFile(filePath, targetPath);
        }
    });
}

// 主函数
(async () => {
    await processImages(sourceDir);
    console.log('Processing completed.');
})();

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');
const imageData = require('./config.js');
// 下载图片的函数
async function downloadImage(url, savePath) {
    return new Promise((resolve, reject) => {
        // 创建目录（如果不存在）
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 发送请求
        const request = https.get(url, (response) => {
            // 检查响应状态
            if (response.statusCode !== 200) {
                reject(new Error(`请求失败，状态码: ${response.statusCode}`));
                return;
            }

            // 创建文件写入流
            const fileStream = fs.createWriteStream(savePath);
            response.pipe(fileStream);

            // 完成时处理
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });

            // 错误处理
            fileStream.on('error', (err) => {
                fs.unlink(savePath, () => { }); // 删除不完整文件
                reject(err);
            });
        });

        // 处理请求错误
        request.on('error', (err) => {
            reject(err);
        });

        // 超时处理
        request.setTimeout(10000, () => {
            request.abort();
            reject(new Error('请求超时'));
        });
    });
}

// 批量下载图片
async function batchDownload(images) {
    for (const imgInfo of images) {
        try {
            // 解析图片URL获取扩展名
            const url = new URL(imgInfo.img);
            const pathname = url.pathname;
            const ext = '.jpg'; // 默认jpg

            // 构建保存路径（当前目录下的images文件夹）
            const savePath = path.join(__dirname, 'images', `${imgInfo.name}${ext}`);

            console.log(`开始下载: ${imgInfo.name}`);
            await downloadImage(imgInfo.img, savePath);
            console.log(`下载完成: ${imgInfo.name} -> ${savePath}`);
        } catch (error) {
            console.error(`下载失败 ${imgInfo.name}:`, error.message);
        }
    }
}

// 执行下载
batchDownload(imageData);
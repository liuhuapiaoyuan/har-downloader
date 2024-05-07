const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


// 定义输出目录
const OUTPUT_DIR = path.join(__dirname, '../', 'output');

// 替换此处即可获得下载
const HAR_FILE_PATH = path.join(__dirname, '../temp/markdown.devtool.tech.har');
// 读取HAR文件
fs.readFile(HAR_FILE_PATH, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading HAR file:', err);
    return;
  }

  // 解析HAR数据
  const harData = JSON.parse(data);

  //.filter(entry => {
  //   if (!entry.request.method === 'GET') {
  //     return
  //   }
  //   const url = entry.request.url
  //   // 判断是否是  jpg,png,js
  //   const extensitions = ['jpg', 'png', 'js', 'css', 'jpeg']
  //   return extensitions.some(ext => url.endsWith(ext))
  //   //&& (entry.request.url.endsWith('.js') || entry.request.url.endsWith('.mjs') || entry.request.url.endsWith('.css') || entry.request.url.endsWith('.png'));
  // })
  // 提取所有JavaScript文件的URL
  const jsUrls = harData.log.entries.map(entry => entry.request.url);
  jsUrls.forEach(url => {
    let safeUrl = url.replace('https://', '');
    safeUrl = safeUrl.replace('http://', '');
    const paths = safeUrl.split('/')
    const fileName = paths.pop();
    // 创建前面的目录
    const dir = path.join(OUTPUT_DIR, paths.join('/'));
    // 如果目录不存在 就创建目录
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, fileName);
    const request = harData.log.entries.find(entry => entry.request.url === url).response.content.text;
    if (request) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      downloadJS(url, filePath, fileName)

    }
  });

});


// 下载JS文件
async function downloadJS(url, filePath, fileName) {
  try {
    const response = await fetch(url);
    const jsContent = await response.text();
    fs.writeFileSync(filePath, jsContent);
    console.log(`Downloaded: ${fileName}`);
  } catch (error) {
    console.error(`Failed to download from ${url}: ${error}`);
  }
}

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// 定义输出目录
const OUTPUT_DIR = path.join(__dirname, '../', 'output');

// HAR文件路径
const HAR_FILE_PATH = path.join(__dirname, '../temp/www.tripo3d.ai.har');

// 域名映射规则
const DOMAIN_MAP = {
  'https://api.tripo3d.ai': 'api.tripo3d.ai',
  'https://firebaseinstallations.googleapis.com': 'firebaseinstallations.googleapis.com',
  'https://files.authing.co': 'files.authing.co',
  'https://firebaselogging-pa.googleapis.com': 'firebaselogging-pa.googleapis.com',
  'https://tripo-data.cdn.bcebos.com': 'tripo-data.cdn.bcebos.com',
  'https://www.googletagmanager.com': 'www.googletagmanager.com',
  'https://cdn.authing.co': 'cdn.authing.co',
  'https://firebase.googleapis.com': 'firebase.googleapis.com',
  'https://lh3.googleusercontent.com': 'lh3.googleusercontent.com',
  'https://tripo-web.us.authing.co': 'tripo-web.us.authing.co',
  'https://www.tripo3d.ai': '/',
};

// 读取HAR文件
fs.readFile(HAR_FILE_PATH, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading HAR file:', err);
    return;
  }

  // 解析HAR数据
  const harData = JSON.parse(data); 
  const jsUrls = harData.log.entries.map(entry => entry.request.url);
  jsUrls.forEach(url => {
    let originUrl = new URL(url)
    if(originUrl.pathname=='/'){
       originUrl = new URL(url + "/index.html")
    }
    const targetPath = DOMAIN_MAP[originUrl.origin]
    let safeUrl = originUrl.host + originUrl.pathname
    if(targetPath){
      safeUrl = targetPath + originUrl.pathname
    }
   
   


    const paths = safeUrl.split('/');
    const fileName = paths.pop();
    const dir = path.join(OUTPUT_DIR, paths.join('/'));

    // 创建目录
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, fileName);
    const request = harData.log.entries.find(entry => entry.request.url === url).response.content.text;
    if (request) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // 如果是多媒体 应该要直接下载

      downloadAndReplaceJS(url, filePath, fileName, DOMAIN_MAP);
    }
  });
});

// 下载并替换JS文件内容中的域名
async function downloadAndReplaceJS(url, filePath, fileName, domainMap) {
  try {

    
 
    const response = await fetch(url);
     // 判断响应内容类型
    const contentType = response.headers.get('content-type');
     // 判断文件后缀名是否是.js
     const isJsFile = url.endsWith('.js');
     const isText = contentType && contentType.includes('text')
    if (isJsFile || isText) {

      let jsContent = await response.text();
  
      // 替换JS文件内容中的域名
      Object.keys(domainMap).forEach(originalDomain => {
        const targetDomain = domainMap[originalDomain];
        const regex = new RegExp(originalDomain, 'g');
        jsContent = jsContent.replace(regex, "/" + targetDomain);
      });
     
      fs.writeFileSync(filePath, jsContent);
      console.log(`Downloaded and replaced: ${fileName}`);
    }else{
      const buffer = await response.buffer();
      fs.writeFileSync(filePath, buffer);
      console.log(`Downloaded binary file: ${fileName}`);
    }

  } catch (error) {
    console.error(`Failed to download from ${url}: ${error}`);
  }
}

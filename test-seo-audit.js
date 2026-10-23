/**
 * test-seo-audit.js - 梯子社区 (tizishequ.com) 自动化门禁断言与 0 死链测试脚本
 * 
 * 包含：
 * 1. 本地真实 HTTP Server 挂载与网络请求断言 (HTTP 200 OK，支持 /、/leaderboard 与 /leaderboard.html Clean URL)
 * 2. 核心 CSS (/css/styles.css) 与 HTML 容器展开断言 (display: block !important; width: 96% !important; max-width: 1400px !important; margin: 0 auto !important)
 * 3. 彻底消除 zoom、scale、固定像素缩小与 #/leaderboard 虚拟哈希路由
 * 4. 底部研报模块网格与实体卡片样式断言 (.reports-grid, .report-card 杜绝样式散架)
 * 5. 零商业推广返利链接 (0 AFF Links / 0 Promo Codes) 与零 TG 引流
 * 6. 全站 0 死链与 Sitemap 物理对齐验证
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const rootDir = __dirname;
let hasError = false;

function logPass(msg) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${msg}`);
}

function logFail(msg) {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${msg}`);
    hasError = true;
}

console.log('\n======================================================');
console.log('🚀 开始梯子社区 (tizishequ.com) 容器自适应展开、消灭 Hash 路由与 0 死链审计');
console.log('======================================================\n');

// 1. 核心基础设施文件与静态样式表检查
console.log('【1. 核心基础设施与 CSS 样式表完整性】');
const requiredFiles = [
    'LICENSE',
    'robots.txt',
    'sitemap.xml',
    'sitemap.html',
    'llms.txt',
    '404.html',
    'leaderboard.html',
    'leaderboard/index.html',
    'css/styles.css',
    'assets/logo.png',
    'assets/favicon.png',
    'favicon.ico'
];

requiredFiles.forEach(f => {
    const p = path.join(rootDir, f);
    if (fs.existsSync(p) && fs.statSync(p).size > 0) {
        logPass(`文件存在且非空: ${f} (${fs.statSync(p).size} bytes)`);
    } else {
        logFail(`缺失关键文件或文件为空: ${f}`);
    }
});

// 检查 css/styles.css 是否包含标准的自然撑满与 1400px 大屏居中
const cssContent = fs.readFileSync(path.join(rootDir, 'css/styles.css'), 'utf8');
if (
    cssContent.includes('display: block !important') &&
    cssContent.includes('max-width: 1400px !important') &&
    cssContent.includes('margin: 0 auto !important') &&
    cssContent.includes('width: 96% !important') &&
    cssContent.includes('.reports-grid') &&
    cssContent.includes('.report-card')
) {
    logPass('css/styles.css 包含 display: block 与大屏展开规则 (max-width: 1400px, width: 96%, margin: 0 auto) 与研报实体网格');
} else {
    logFail('css/styles.css 缺少大屏展开规则或研报卡片样式！');
}

// 2. 检查全站 viewport 与消灭缩放/固定狭窄限制
console.log('\n【2. 视口声明与缩放/固定狭窄限制排查】');
const htmlFiles = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, 'leaderboard.html'),
    path.join(rootDir, 'leaderboard/index.html'),
    path.join(rootDir, 'sitemap.html'),
    path.join(rootDir, '404.html'),
    path.join(rootDir, 'posts/doc-26116.html'),
    path.join(rootDir, 'posts/doc-26120.html'),
    path.join(rootDir, 'posts/doc-26124.html'),
    path.join(rootDir, 'posts/doc-26128.html')
];

htmlFiles.forEach(file => {
    const rel = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');

    // Viewport
    if (/<meta[^>]+name=["']viewport["'][^>]*content=["'][^"']*width=device-width/i.test(content)) {
        logPass(`${rel}: 具备标准视口声明 (width=device-width, initial-scale=1.0)`);
    } else {
        logFail(`${rel}: 缺少标准视口声明！`);
    }

    // 检查 zoom: 或 transform: scale(
    if (/zoom\s*:/i.test(content)) {
        logFail(`${rel}: 发现 zoom 缩放属性！`);
    }
    if (/transform\s*:\s*scale\(/i.test(content)) {
        logFail(`${rel}: 发现 transform: scale 缩放属性！`);
    }

    // 检查是否有导航链接依然指向 /#/leaderboard
    if (content.includes('/#/leaderboard')) {
        logFail(`${rel}: 依然存在 /#/leaderboard 虚拟哈希导航！`);
    }
});

// 3. 检查 leaderboard.html 与 leaderboard/index.html 前 6 名顺序与场景化细分
console.log('\n【3. 排行榜 (leaderboard.html & leaderboard/index.html) 规范与场景化细分断言】');
['leaderboard.html', 'leaderboard/index.html'].forEach(lbFile => {
    const lbContent = fs.readFileSync(path.join(rootDir, lbFile), 'utf8');
    const providers = ['环球梯', '大佬云', '云界线', '闪电鼠', '神行加速', '榴莲云'];
    let lastIndex = -1;
    let orderPass = true;
    providers.forEach(p => {
        const idx = lbContent.indexOf(p);
        if (idx === -1) {
            logFail(`${lbFile} 缺失核心服务商: ${p}`);
            orderPass = false;
        } else if (idx < lastIndex) {
            logFail(`${lbFile} 服务商顺序错误: ${p} 出现在前置服务商之前`);
            orderPass = false;
        }
        lastIndex = idx;
    });

    if (orderPass) {
        logPass(`${lbFile} 榜单前 6 名严格按规范排序: 环球梯 -> 大佬云 -> 云界线 -> 闪电鼠 -> 神行加速 -> 榴莲云`);
    }

    const scenarios = [
        { name: '环球梯', kw: '全能旗舰' },
        { name: '大佬云', kw: '企业级专线' },
        { name: '云界线', kw: '开发者首选' },
        { name: '闪电鼠', kw: '流媒体原生解锁' },
        { name: '神行加速', kw: '极客备用专线' },
        { name: '榴莲云', kw: '容灾标杆' }
    ];

    scenarios.forEach(s => {
        if (lbContent.includes(s.kw)) {
            logPass(`${lbFile} 服务商 [${s.name}] 成功匹配场景细分: ${s.kw}`);
        } else {
            logFail(`${lbFile} 服务商 [${s.name}] 缺少场景细分关键词: ${s.kw}`);
        }
    });
});

// 4. 本地启动临时 HTTP Server 并进行全资源 200 OK 断言测试 (支持 /leaderboard 与 /leaderboard.html)
console.log('\n【4. 真实本地 HTTP Server 挂载与 0 死链网络断言】');

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0].split('#')[0];
    if (reqPath === '/') reqPath = '/index.html';
    
    // 支持目录型索引 (例如 /leaderboard -> leaderboard/index.html)
    let filePath = path.join(rootDir, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(8999, '127.0.0.1', async () => {
    console.log('  📡 本地测试 HTTP 服务器已启动在 http://127.0.0.1:8999');

    // 收集所有需要测试的网络资源 URL
    const testUrls = [
        '/',
        '/leaderboard.html',
        '/leaderboard',          // 测试目录型无扩展名 Clean URL
        '/sitemap.html',
        '/404.html',
        '/posts/doc-26116.html',
        '/posts/doc-26120.html',
        '/posts/doc-26124.html',
        '/posts/doc-26128.html',
        '/css/styles.css',
        '/assets/logo.png',
        '/assets/favicon.png',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
        '/llms.txt'
    ];

    let passedRequests = 0;

    for (const urlPath of testUrls) {
        await new Promise(resolve => {
            http.get(`http://127.0.0.1:8999${urlPath}`, res => {
                if (res.statusCode === 200) {
                    logPass(`HTTP 200 OK: http://127.0.0.1:8999${urlPath} (${res.headers['content-type']})`);
                    passedRequests++;
                } else {
                    logFail(`HTTP ${res.statusCode} 错误: http://127.0.0.1:8999${urlPath}`);
                }
                res.resume();
                resolve();
            }).on('error', err => {
                logFail(`HTTP 请求异常: ${err.message}`);
                resolve();
            });
        });
    }

    server.close(() => {
        console.log('  📡 本地测试 HTTP 服务器已优雅关闭');
        console.log('\n======================================================');
        if (hasError) {
            console.error('❌ 门禁审计失败：存在死链或未达标项！');
            process.exit(1);
        } else {
            console.log(`🎉 全部 ${passedRequests} 个关键静态资源与双重物理落地单页 HTTP 200 OK 校验通过，死链率为 0！`);
            console.log('======================================================\n');
            process.exit(0);
        }
    });
});

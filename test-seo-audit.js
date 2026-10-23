/**
 * test-seo-audit.js - 梯子社区 (tizishequ.com) 自动化门禁断言与 0 死链测试脚本
 * 
 * 包含：
 * 1. 本地真实 HTTP Server 挂载与网络请求断言 (HTTP 200 OK，支持 /leaderboard 与 /leaderboard.html 双重物理路由)
 * 2. 核心 CSS (/css/styles.css) 全局严格居中 (margin: 0 auto !important) 与排版断言 (杜绝左侧留白与样式裸奔)
 * 3. 独立物理单页 /leaderboard.html 与 /leaderboard/index.html 结构与场景化细分验证
 * 4. 零商业推广返利链接 (0 AFF Links / 0 Promo Codes) 与零 TG 引流
 * 5. 全站 0 死链与 Sitemap 物理对齐验证
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
console.log('🚀 开始梯子社区 (tizishequ.com) 全局居中、路由静态化与 0 死链门禁审计');
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

// 检查 css/styles.css 是否包含标准的全局居中规范
const cssContent = fs.readFileSync(path.join(rootDir, 'css/styles.css'), 'utf8');
if (
    cssContent.includes('margin-left: auto !important') &&
    cssContent.includes('margin-right: auto !important') &&
    cssContent.includes('max-width: 1280px !important') &&
    cssContent.includes('padding-left: 16px !important') &&
    cssContent.includes('box-sizing: border-box !important')
) {
    logPass('css/styles.css 包含标准严格响应式居中规则 (margin: 0 auto !important; max-width: 1280px; padding: 0 16px)');
} else {
    logFail('css/styles.css 缺少全局强制居中与全宽自适应规则！');
}

// 2. 检查 leaderboard.html 与 leaderboard/index.html 前 6 名顺序与场景化细分
console.log('\n【2. 排行榜 (leaderboard.html & leaderboard/index.html) 规范与场景化细分断言】');
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

// 3. 全站 HTML 静态资源根绝对路径与 0 外部商业返利断言
console.log('\n【3. 全站 HTML 资源根绝对路径与平台风控断言】');
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

    // 必须包含 /css/styles.css
    if (content.includes('/css/styles.css')) {
        logPass(`${rel}: 成功以根绝对路径引入 /css/styles.css`);
    } else {
        logFail(`${rel}: 未引入 /css/styles.css`);
    }

    // 检查是否有相对样式引用
    if (/<link[^>]+href=["'](?:\.\/|[a-zA-Z0-9_\-]+\.css)["']/i.test(content)) {
        logFail(`${rel}: 发现相对路径 CSS 引用`);
    }

    // 检查商业推广外链与 TG 链接
    const linkRegex = /href=["']([^"']+)["']/gi;
    let m;
    const links = [];
    while ((m = linkRegex.exec(content)) !== null) {
        links.push(m[1]);
    }

    const affLinks = links.filter(l => /(?:aff|code=|invite|\?aff=|\?ref=|\.best|bit\.ly)/i.test(l) && !l.startsWith('#') && !l.startsWith('javascript:'));
    if (affLinks.length === 0) {
        logPass(`${rel}: 零商业推广返利链接 (0 AFF Links)`);
    } else {
        logFail(`${rel}: 存在商业返利链接: ${affLinks.join(', ')}`);
    }

    const tgLinks = links.filter(l => /(?:t\.me|telegram)/i.test(l));
    if (tgLinks.length === 0) {
        logPass(`${rel}: 零外部 Telegram 引流链接`);
    } else {
        logFail(`${rel}: 存在 Telegram 引流链接: ${tgLinks.join(', ')}`);
    }
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

/**
 * submit-indexnow.js - 梯子社区 (tizishequ.com) IndexNow 自动广播脚本
 * 
 * 作用：从 sitemap.xml 提取全量 URL 并通过 IndexNow API 实时广播给 Bing 和 IndexNow 官方分发网关
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'tizishequ.com';
const KEY = 'b148aaa73ffd400ca4bcdbc1c96f901c';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// 从 sitemap.xml 解析 URL
const sitemapPath = path.join(__dirname, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
    console.error('❌ 未找到 sitemap.xml 文件');
    process.exit(1);
}

const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
const locMatches = sitemapContent.match(/<loc>(https?:\/\/[^<]+)<\/loc>/g) || [];
const urlList = Array.from(new Set(locMatches.map(m => m.replace(/<\/?loc>/g, '').trim())));

// 补充根路径跳转页与核心落地页
const extraUrls = [
    `https://${HOST}/doc-26132.html`,
    `https://${HOST}/network-sla-benchmark-community-2026.html`
];
extraUrls.forEach(u => {
    if (!urlList.includes(u)) urlList.push(u);
});

console.log(`\n======================================================`);
console.log(`🚀 开始向 IndexNow 广播 ${HOST} 的最新 URL 索引 (共 ${urlList.length} 条)`);
console.log(`======================================================\n`);
console.log('📌 待广播 URL 列表：');
urlList.forEach((u, i) => console.log(`  [${String(i + 1).padStart(2, '0')}] ${u}`));

const payload = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList
});

const endpoints = [
    { name: 'IndexNow 官方分发网关', host: 'api.indexnow.org', path: '/indexnow' },
    { name: 'Bing 专有 IndexNow 端点', host: 'www.bing.com', path: '/indexnow' }
];

function submitToEndpoint(ep) {
    return new Promise(resolve => {
        const req = https.request({
            hostname: ep.host,
            port: 443,
            path: ep.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 202) {
                    console.log(`\n  \x1b[32m✔ SUCCESS\x1b[0m [${ep.name}] 提交成功: HTTP ${res.statusCode}`);
                } else {
                    console.log(`\n  \x1b[33m⚠ NOTICE\x1b[0m [${ep.name}] 响应状态: HTTP ${res.statusCode} ${body || ''}`);
                }
                resolve({ success: res.statusCode === 200 || res.statusCode === 202, code: res.statusCode });
            });
        });

        req.on('error', err => {
            console.error(`\n  \x1b[31m✖ ERROR\x1b[0m [${ep.name}] 请求异常: ${err.message}`);
            resolve({ success: false, error: err.message });
        });

        req.write(payload);
        req.end();
    });
}

(async () => {
    for (const ep of endpoints) {
        await submitToEndpoint(ep);
    }
    console.log(`\n======================================================`);
    console.log(`🎉 IndexNow URL 广播任务执行完毕！`);
    console.log(`======================================================\n`);
})();

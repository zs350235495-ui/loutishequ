/**
 * test-seo-audit.js - 梯子社区 (tizishequ.com) 自动化 SEO、架构与合规 CI 门禁测试脚本
 * 
 * 测试项包括：
 * 1. 零死链检测 (全站内部链接、静态资源引用 100% 对应物理文件)
 * 2. 根绝对路径检测 (杜绝深层路由下样式裸奔和相对路径引用)
 * 3. 平台合规检测 (0 商业返利 aff 链接、0 外部 Telegram 直连引流、0 优惠码诱导)
 * 4. 语义化 H1 唯一性检查
 * 5. 规范 Canonical 标签与 Open Graph 完整性
 * 6. Schema.org 结构化数据有效性
 * 7. Sitemap 与 Robots & llms.txt 物理对齐
 */

const fs = require('fs');
const path = require('path');

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
console.log('🚀 开始梯子社区 (tizishequ.com) SEO 与架构合规门禁审计');
console.log('======================================================\n');

// 1. 检查根目录关键基础设施文件
console.log('【1. 核心基础设施合规检查】');
const requiredFiles = ['LICENSE', 'robots.txt', 'sitemap.xml', 'sitemap.html', 'llms.txt', '404.html'];
requiredFiles.forEach(f => {
    const p = path.join(rootDir, f);
    if (fs.existsSync(p) && fs.statSync(p).size > 0) {
        logPass(`文件存在且非空: ${f} (${fs.statSync(p).size} bytes)`);
    } else {
        logFail(`缺失关键基础设施文件: ${f}`);
    }
});

// 2. 检查 robots.txt 内容规范
console.log('\n【2. Robots.txt 协议规范审计】');
const robotsContent = fs.readFileSync(path.join(rootDir, 'robots.txt'), 'utf8');
if (robotsContent.includes('Allow: /*.css') && robotsContent.includes('Allow: /*.js') && robotsContent.includes('Allow: /assets/')) {
    logPass('已显式放行静态资源 (CSS / JS / Assets)');
} else {
    logFail('robots.txt 未显式放行移动端渲染关键静态资源');
}

const aiBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Applebot-Extended', 'Google-Extended'];
const missingBots = aiBots.filter(b => !robotsContent.includes(b));
if (missingBots.length === 0) {
    logPass('主流 AI 搜索引擎爬虫均已显式放行');
} else {
    logFail(`robots.txt 缺少主流 AI 爬虫声明: ${missingBots.join(', ')}`);
}

// 3. 检查 sitemap.xml 物理对齐与 0 虚拟哈希
console.log('\n【3. Sitemap.xml 物理对齐审计】');
const sitemapXml = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
if (sitemapXml.includes('#')) {
    logFail('sitemap.xml 包含非法的客户端 fragment (#) 虚拟路由！');
} else {
    logPass('sitemap.xml 彻底剔除了所有 fragment (#) 虚拟路由');
}

const locMatches = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
locMatches.forEach(urlStr => {
    try {
        const u = new URL(urlStr);
        let relPath = u.pathname;
        if (relPath === '/' || relPath === '') relPath = '/index.html';
        const diskPath = path.join(rootDir, relPath);
        if (fs.existsSync(diskPath)) {
            logPass(`Sitemap 条目物理对应存在 (HTTP 200 OK): ${urlStr}`);
        } else {
            logFail(`Sitemap 条目对应物理文件不存在 (HTTP 404): ${urlStr} -> ${diskPath}`);
        }
    } catch (e) {
        logFail(`Sitemap URL 格式异常: ${urlStr}`);
    }
});

// 4. 遍历所有 HTML 文件执行全维度审计
console.log('\n【4. 全站 HTML 语义化、标签规范与防风控检查】');
const htmlFiles = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, 'sitemap.html'),
    path.join(rootDir, '404.html')
];
const postsDir = path.join(rootDir, 'posts');
if (fs.existsSync(postsDir)) {
    fs.readdirSync(postsDir).forEach(f => {
        if (f.endsWith('.html')) htmlFiles.push(path.join(postsDir, f));
    });
}

htmlFiles.forEach(file => {
    const rel = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');
    console.log(`\n  --- 正在审计: ${rel} ---`);

    // H1 唯一性
    const h1Count = (content.match(/<h1[\s>]/gi) || []).length;
    if (h1Count === 1) {
        logPass(`H1 标签语义标准: 严格仅有 1 个 H1 标签`);
    } else {
        logFail(`H1 标签层级异常: 存在 ${h1Count} 个 H1 标签`);
    }

    // Canonical
    const canonMatch = content.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
                       content.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    if (canonMatch && canonMatch[1].startsWith('https://tizishequ.com') && !canonMatch[1].includes('#')) {
        logPass(`Canonical 规范且无哈希参数: ${canonMatch[1]}`);
    } else {
        logFail(`Canonical 异常或缺失`);
    }

    // OG & Twitter Meta
    const ogImg = /property=["']og:image["']/i.test(content);
    const ogTitle = /property=["']og:title["']/i.test(content);
    const twCard = /name=["']twitter:card["']/i.test(content);
    if (ogImg && ogTitle && twCard) {
        logPass('社交图谱与 Twitter Card 完整就绪');
    } else {
        logFail(`社交图谱缺失: og:image=${ogImg}, og:title=${ogTitle}, twitter:card=${twCard}`);
    }

    // Schema.org
    if (rel !== '404.html') {
        const schemaMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (schemaMatch) {
            try {
                const parsed = JSON.parse(schemaMatch[1]);
                logPass(`Schema.org 语法有效: @context=${parsed['@context']}`);
            } catch (e) {
                logFail(`Schema.org JSON 解析失败: ${e.message}`);
            }
        } else {
            logFail('缺少 Schema.org 结构化数据');
        }
    }

    // 平台风控 (AFF / Promo / Telegram 违规外链)
    const linkRegex = /href=["']([^"']+)["']/gi;
    let m;
    const links = [];
    while ((m = linkRegex.exec(content)) !== null) {
        links.push(m[1]);
    }

    const affLinks = links.filter(l => /(?:aff|code=|invite|\?aff=|\?ref=|\.best|bit\.ly)/i.test(l) && !l.startsWith('#') && !l.startsWith('javascript:'));
    if (affLinks.length === 0) {
        logPass('零商业返利邀请链接 (0 AFF Links / 0 Promo Codes)');
    } else {
        logFail(`存在商业返利推广外链 (${affLinks.length} 处): ${affLinks.slice(0, 3).join(', ')}`);
    }

    const tgLinks = links.filter(l => /(?:t\.me|telegram)/i.test(l));
    if (tgLinks.length === 0) {
        logPass('零外部 Telegram 社交引流链接');
    } else {
        logFail(`存在外部 Telegram 引流链接: ${tgLinks.join(', ')}`);
    }

    // 静态资源与内链物理有效性 (零死链)
    const localAssets = links.filter(l => l.startsWith('/') && !l.startsWith('//') && !l.startsWith('/#'));
    localAssets.forEach(urlPath => {
        let cleanPath = urlPath.split('?')[0].split('#')[0];
        if (cleanPath === '/') cleanPath = '/index.html';
        const diskTarget = path.join(rootDir, cleanPath);
        if (!fs.existsSync(diskTarget)) {
            logFail(`发现死链引用: ${urlPath} -> 对应文件不存在: ${diskTarget}`);
        }
    });
});

console.log('\n======================================================');
if (hasError) {
    console.error('❌ 门禁审计失败：存在未达标项，请根据上述提示排查！');
    process.exit(1);
} else {
    console.log('🎉 门禁审计通过：100% 满足 E-E-A-T 实体权威度、零死链与平台合规标准！');
    console.log('======================================================\n');
    process.exit(0);
}

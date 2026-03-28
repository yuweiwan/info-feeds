#!/usr/bin/env node
/**
 * RSS Full Content 抓取脚本
 *
 * 对于微信公众号等只提供元数据、需要二次抓取原文的 RSS 源
 * 1. 先获取 RSS 元数据（标题、链接、发布时间等）
 * 2. 对于需要原文的链接，使用模拟 UA 的方式获取全文
 *
 * 支持的域名：
 * - mp.weixin.qq.com (微信公众号)
 * - 及其他需要特殊处理的域名
 *
 * 用法：
 *   node rss-full.mjs --url <feed_url> [--limit <n>] [--fetch-full]
 */

import Parser from 'rss-parser';
import nodeFetch from 'node-fetch';
import { execSync } from 'child_process';
import { normalizeDate, readStdin, safeJsonParse } from './utils.mjs';

const parser = new Parser({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
  },
  customFields: {
    item: [
      ['entry', 'entries'],
    ],
    feed: [
      ['subtitle', 'subtitle'],
      ['rights', 'rights'],
    ]
  },
  fetch: nodeFetch
});

// 需要二次抓取原文的域名配置
const FULL_CONTENT_DOMAINS = {
  'mp.weixin.qq.com': {
    // 微信公众号：需要模拟浏览器 UA
    fetcher: 'wechat',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': 'https://mp.weixin.qq.com/'
    }
  }
};

/**
 * 使用 curl 获取需要原文的内容
 */
async function fetchFullContentCurl(url, config) {
  const { headers = {} } = config;

  // 构建 curl 命令
  const headerArgs = Object.entries(headers)
    .map(([k, v]) => `-H "${k}: ${v}"`)
    .join(' ');

  const cmd = `curl -sL --connect-timeout 20 ${headerArgs} "${url}"`;

  try {
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return output;
  } catch (error) {
    return null;
  }
}

/**
 * 从 HTML 中提取正文内容
 */
function extractContent(html, domain) {
  if (!html) return '';

  if (domain === 'mp.weixin.qq.com') {
    // 微信公众号：提取 js_content 内的内容
    const jsContentMatch = html.match(/id="js_content"[^>]*>(.*?)<\/div>/s);
    if (jsContentMatch) {
      let content = jsContentMatch[1];
      // 去掉 HTML 标签
      content = content.replace(/<[^>]+>/g, ' ');
      // 清理实体
      content = content.replace(/&nbsp;/g, ' ');
      content = content.replace(/&amp;/g, '&');
      content = content.replace(/&lt;/g, '<');
      content = content.replace(/&gt;/g, '>');
      content = content.replace(/&quot;/g, '"');
      content = content.replace(/&#39;/g, "'");
      // 合并多余空格
      content = content.replace(/\s+/g, ' ').trim();
      return content;
    }
  }

  return '';
}

/**
 * 判断 URL 是否需要获取全文
 */
function needsFullContent(url) {
  try {
    const urlObj = new URL(url);
    return FULL_CONTENT_DOMAINS.hasOwnProperty(urlObj.hostname);
  } catch {
    return false;
  }
}

/**
 * 获取域名配置
 */
function getDomainConfig(url) {
  try {
    const urlObj = new URL(url);
    return FULL_CONTENT_DOMAINS[urlObj.hostname] || null;
  } catch {
    return null;
  }
}

/**
 * 抓取单个文章的全文
 */
async function fetchArticleFullContent(url) {
  const domainConfig = getDomainConfig(url);

  if (!domainConfig) {
    return null; // 不需要获取全文
  }

  if (domainConfig.fetcher === 'wechat') {
    const html = await fetchFullContentCurl(url, domainConfig);
    return extractContent(html, 'mp.weixin.qq.com');
  }

  return null;
}

/**
 * 使用 curl 获取 RSS feed（同步）
 */
function fetchRSSViaCurl(url) {
  const cmd = `curl -sL --connect-timeout 30 -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: application/rss+xml, application/xml, text/xml, */*" -H "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8" "${url}"`;

  try {
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    return output;
  } catch (error) {
    return null;
  }
}

/**
 * 抓取 RSS feed
 */
async function fetchRSS(config) {
  const { url, limit = 50, fetchFull = true } = config;

  let feed;
  try {
    // 优先使用 rss-parser
    feed = await parser.parseURL(url);
  } catch (error) {
    // 如果失败，尝试使用 curl 获取后再解析
    console.error(`rss-parser 失败，尝试 curl: ${error.message}`);
    const xmlContent = fetchRSSViaCurl(url);
    if (!xmlContent) {
      throw new Error('RSS 获取失败');
    }
    feed = await parser.parseString(xmlContent);
  }

  // 提取文章列表
  const articles = feed.items.slice(0, limit).map(item => {
    // 提取发布时间 - 兼容 RSS 和 Atom
    const pubDate = item.pubDate || item.isoDate || item.published || item.updated || new Date().toISOString();

    // 提取内容 - 兼容 RSS 和 Atom
    const content = item.contentSnippet || item.content || item.summary || item.description || '';

    // 提取作者 - 兼容 RSS 和 Atom
    const author = item.creator || item.author || item.author?.name || feed.title || '';

    // 提取链接 - Atom 用 href 属性
    const link = item.link || (item.link?.href) || item.guid || '';

    return {
      title: item.title || 'Untitled',
      url: link,
      time: normalizeDate(pubDate),
      content: content.substring(0, 1000), // 限制内容长度
      author,
      metadata: {
        feedTitle: feed.title,
        categories: item.categories || [],
        guid: item.guid
      }
    };
  });

  // 如果需要获取全文，且有配置
  if (fetchFull && Object.keys(FULL_CONTENT_DOMAINS).length > 0) {
    console.error('开始获取全文...');

    for (const article of articles) {
      if (needsFullContent(article.url)) {
        console.error(`  获取: ${article.title.substring(0, 30)}...`);
        const fullContent = await fetchArticleFullContent(article.url);
        if (fullContent && fullContent.length > article.content.length) {
          article.content = fullContent;
          article.metadata.fullContentFetched = true;
        }
      }
    }
  }

  return articles;
}

// CLI 入口
async function main() {
  try {
    let config = {};

    // 手动解析命令行参数
    const args = process.argv.slice(2);

    // 查找 --url 参数
    const urlIndex = args.indexOf('--url');
    if (urlIndex !== -1 && args[urlIndex + 1]) {
      config.url = args[urlIndex + 1];
    }

    // 查找 --limit 参数
    const limitIndex = args.indexOf('--limit');
    if (limitIndex !== -1 && args[limitIndex + 1]) {
      config.limit = parseInt(args[limitIndex + 1], 10);
    }

    // 查找 --fetch-full 参数
    const fetchFullIndex = args.indexOf('--fetch-full');
    config.fetchFull = fetchFullIndex !== -1;

    // 如果没有 --url，检查位置参数（executeFetcher 传入 JSON）
    if (!config.url && args.length > 0) {
      const firstArg = args[0];
      if (firstArg && !firstArg.startsWith('--')) {
        const parsed = safeJsonParse(firstArg, null);
        if (parsed && parsed.url) {
          config = parsed;
        }
      }
    }

    // 如果还是没有配置，尝试从 stdin 读取
    if (!config.url && !process.stdin.isTTY) {
      const input = await readStdin();
      config = safeJsonParse(input, {});
    }

    if (!config.url) {
      console.error('用法: node rss-full.mjs --url <feed_url> [--limit <n>] [--fetch-full]');
      console.error('或: echo \'{"url":"https://...","limit":20,"fetchFull":true}\' | node rss-full.mjs');
      console.error('');
      console.error('参数说明:');
      console.error('  --url        RSS 源地址');
      console.error('  --limit      最多获取文章数（默认 50）');
      console.error('  --fetch-full 是否获取全文（仅对支持的域名有效）');
      process.exit(1);
    }

    const articles = await fetchRSS(config);
    console.log(JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

// 判断是否直接运行（而非被 import）
if (process.argv[1] && process.argv[1].endsWith('rss-full.mjs')) {
  main();
}

export { fetchRSS };

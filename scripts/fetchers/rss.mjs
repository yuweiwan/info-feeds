#!/usr/bin/env node
/**
 * RSS/Atom 抓取脚本
 *
 * 使用 rss-parser 库抓取 RSS/Atom feed
 *
 * 用法：
 *   node rss.mjs --url <feed_url> [--limit <n>]
 *   echo '{"url":"https://...","limit":20}' | node rss.mjs
 */

import Parser from 'rss-parser';
import nodeFetch from 'node-fetch';
import { normalizeDate, readStdin, safeJsonParse } from './utils.mjs';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
  },
  customFields: {
    item: [
      ['entry', 'entries'],       // Atom entry → item
    ],
    feed: [
      ['subtitle', 'subtitle'],
      ['rights', 'rights'],
    ]
  },
  fetch: nodeFetch
});

/**
 * 抓取 RSS feed
 */
async function fetchRSS(config) {
  const { url, limit = 50 } = config;

  try {
    const feed = await parser.parseURL(url);

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

    return articles;
  } catch (error) {
    throw new Error(`RSS 抓取失败: ${error.message}`);
  }
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

    // 如果没有 --url，检查位置参数（executeFetcher 传入 JSON）
    if (!config.url && args.length > 0) {
      const firstArg = args[0];
      if (firstArg && !firstArg.startsWith('--')) {
        // 第一个位置参数可能是 JSON
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
      console.error('用法: node rss.mjs --url <feed_url> [--limit <n>]');
      console.error('或: echo \'{"url":"https://...","limit":20}\' | node rss.mjs');
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
if (process.argv[1] && process.argv[1].endsWith('rss.mjs')) {
  main();
}

export { fetchRSS };

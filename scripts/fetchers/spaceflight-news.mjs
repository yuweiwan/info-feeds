#!/usr/bin/env node
/**
 * Spaceflight News 抓取脚本
 * 改造自 glanceway-sources/spaceflight-news
 *
 * 用法：
 *   node spaceflight-news.mjs --limit 20
 */

import { parseArgs } from 'node:util';
import { normalizeDate, readStdin, safeJsonParse, fetch } from './utils.mjs';

async function fetchSpaceflightNews(config = {}) {
  const { limit = 20 } = config;

  const url = `https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch Spaceflight News (HTTP ${response.status})`);
  }

  const data = await response.json();

  return data.results.map(article => ({
    title: article.title,
    url: article.url,
    time: normalizeDate(article.published_at),
    content: article.summary || '',
    author: article.news_site,
    metadata: {
      news_site: article.news_site,
      image_url: article.image_url
    }
  }));
}

// CLI 入口
async function main() {
  try {
    let config = {};

    const { values } = parseArgs({
      options: {
        'limit': { type: 'string', default: '20' }
      },
      strict: false
    });

    if (values.limit) {
      config = { limit: parseInt(values.limit, 10) };
    } else if (!process.stdin.isTTY) {
      const input = await readStdin();
      config = safeJsonParse(input, {});
    }

    const articles = await fetchSpaceflightNews(config);
    console.log(JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('spaceflight-news.mjs')) {
  main();
}

export { fetchSpaceflightNews };

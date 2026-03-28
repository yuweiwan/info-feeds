#!/usr/bin/env node
/**
 * Hacker News 抓取脚本
 * 改造自 glanceway-sources/hacker-news
 *
 * 用法：
 *   node hacker-news.mjs --story-type top
 *   echo '{"storyType":"new"}' | node hacker-news.mjs
 */

import { parseArgs } from 'node:util';
import { normalizeDate, readStdin, safeJsonParse, fetch } from './utils.mjs';

async function fetchHackerNews(config = {}) {
  const { storyType = 'top', limit = 50 } = config;

  // 1. 获取故事 ID 列表
  const listUrl = `https://hacker-news.firebaseio.com/v0/${storyType}stories.json`;
  const listResp = await fetch(listUrl);

  if (!listResp.ok) {
    throw new Error(`Failed to fetch HN story list (HTTP ${listResp.status})`);
  }

  const allIds = await listResp.json();
  const topIds = allIds.slice(0, limit);

  // 2. 并行获取每个故事的详情
  const articles = [];
  const results = await Promise.allSettled(
    topIds.map(async (id) => {
      const itemUrl = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
      const resp = await fetch(itemUrl);

      if (!resp.ok) return null;

      const item = await resp.json();
      if (!item || !item.title) return null;

      return {
        title: item.title,
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        time: normalizeDate(item.time),
        content: item.text || '',
        author: item.by,
        metadata: {
          score: item.score,
          comments: item.descendants || 0,
          hn_id: item.id
        }
      };
    })
  );

  // 3. 过滤成功的结果
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      articles.push(result.value);
    }
  }

  return articles;
}

// CLI 入口
async function main() {
  try {
    let config = {};

    // 尝试从命令行参数读取
    const { values } = parseArgs({
      options: {
        'story-type': { type: 'string', default: 'top' },
        'limit': { type: 'string', default: '50' }
      },
      strict: false
    });

    if (values['story-type'] || values['limit']) {
      config = {
        storyType: values['story-type'],
        limit: parseInt(values['limit'], 10)
      };
    } else if (!process.stdin.isTTY) {
      // 从 stdin 读取 JSON 配置
      const input = await readStdin();
      config = safeJsonParse(input, {});
    }

    const articles = await fetchHackerNews(config);
    console.log(JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// 判断是否直接运行（而非被 import）
if (process.argv[1] && process.argv[1].endsWith('hacker-news.mjs')) {
  main();
}

export { fetchHackerNews };

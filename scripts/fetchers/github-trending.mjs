#!/usr/bin/env node
/**
 * GitHub Trending 抓取脚本
 * 改造自 glanceway-sources/github-trending
 *
 * 用法：
 *   node github-trending.mjs --language javascript --days 7
 *   echo '{"language":"python","days":30}' | node github-trending.mjs
 */

import { parseArgs } from 'node:util';
import { normalizeDate, readStdin, safeJsonParse, fetch } from './utils.mjs';

async function fetchGitHubTrending(config = {}) {
  const { language = '', days = 7, limit = 50 } = config;

  // 计算日期范围
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  // 构造查询
  let query = `created:>${sinceStr} stars:>5`;
  if (language) {
    query += ` language:${language}`;
  }

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub trending (HTTP ${response.status})`);
  }

  const data = await response.json();

  return data.items.map(repo => ({
    title: repo.full_name,
    url: repo.html_url,
    time: normalizeDate(repo.created_at),
    content: repo.description || '',
    author: repo.owner.login,
    metadata: {
      stars: repo.stargazers_count,
      language: repo.language || 'Unknown',
      forks: repo.forks_count
    }
  }));
}

// CLI 入口
async function main() {
  try {
    let config = {};

    const { values } = parseArgs({
      options: {
        'language': { type: 'string', default: '' },
        'days': { type: 'string', default: '7' },
        'limit': { type: 'string', default: '50' }
      },
      strict: false
    });

    if (values.language !== undefined || values.days || values.limit) {
      config = {
        language: values.language,
        days: parseInt(values.days, 10),
        limit: parseInt(values.limit, 10)
      };
    } else if (!process.stdin.isTTY) {
      const input = await readStdin();
      config = safeJsonParse(input, {});
    }

    const articles = await fetchGitHubTrending(config);
    console.log(JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('github-trending.mjs')) {
  main();
}

export { fetchGitHubTrending };

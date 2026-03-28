#!/usr/bin/env node
/**
 * Dev.to 抓取脚本
 * 改造自 glanceway-sources/dev-to
 *
 * 用法：
 *   node dev-to.mjs --api-key YOUR_KEY --tag javascript
 *   echo '{"apiKey":"YOUR_KEY","tag":"python"}' | node dev-to.mjs
 */

import { parseArgs } from 'node:util';
import { normalizeDate, readStdin, safeJsonParse, fetch } from './utils.mjs';

async function fetchDevTo(config = {}) {
  const { apiKey, tag = '', limit = 30 } = config;

  if (!apiKey) {
    throw new Error('Dev.to API key is required. Get one at https://dev.to/settings/extensions');
  }

  let url = `https://dev.to/api/articles?per_page=${limit}`;
  if (tag) {
    url += `&tag=${tag}`;
  }

  const response = await fetch(url, {
    headers: {
      'api-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Dev.to articles (HTTP ${response.status})`);
  }

  const articles = await response.json();

  return articles.map(article => ({
    title: article.title,
    url: article.url,
    time: normalizeDate(article.published_at),
    content: article.description || '',
    author: article.user.name,
    metadata: {
      tags: article.tag_list,
      reactions: article.public_reactions_count,
      comments: article.comments_count
    }
  }));
}

// CLI 入口
async function main() {
  try {
    let config = {};

    const { values } = parseArgs({
      options: {
        'api-key': { type: 'string' },
        'tag': { type: 'string', default: '' },
        'limit': { type: 'string', default: '30' }
      },
      strict: false
    });

    if (values['api-key']) {
      config = {
        apiKey: values['api-key'],
        tag: values.tag,
        limit: parseInt(values.limit, 10)
      };
    } else if (!process.stdin.isTTY) {
      const input = await readStdin();
      config = safeJsonParse(input, {});
    }

    const articles = await fetchDevTo(config);
    console.log(JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('dev-to.mjs')) {
  main();
}

export { fetchDevTo };

#!/usr/bin/env node
/**
 * search 命令：搜索文章
 */

import { loadAllMemories } from '../core/storage.mjs';

export async function search(dataDir, query, options = {}) {
  const memories = await loadAllMemories(dataDir);

  if (memories.length === 0) {
    console.log('还没有任何文章记录');
    return;
  }

  // 搜索逻辑
  const results = memories.filter(m => {
    // 按分类过滤
    if (options.category && m.category !== options.category) {
      return false;
    }

    // 按关键词搜索
    if (query) {
      const lowerQuery = query.toLowerCase();
      return (
        m.title.toLowerCase().includes(lowerQuery) ||
        m.summary.toLowerCase().includes(lowerQuery)
      );
    }

    return true;
  });

  console.log(`找到 ${results.length} 篇文章:\n`);

  for (const article of results.slice(0, 20)) {
    console.log(`[${article.category}] ${article.title}`);
    console.log(`  ${article.summary}`);
    console.log(`  ${article.url}`);
    console.log();
  }

  if (results.length > 20) {
    console.log(`... 还有 ${results.length - 20} 篇`);
  }
}

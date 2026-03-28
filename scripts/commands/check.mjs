#!/usr/bin/env node
/**
 * check 命令：测试抓取
 */

import { loadSources } from '../core/storage.mjs';
import { fetchSource } from '../core/fetch.mjs';

export async function check(dataDir, sourceName = null) {
  const sources = await loadSources(dataDir);

  if (sources.length === 0) {
    console.log('没有配置任何信息源');
    console.log('请编辑 sources.yaml 添加信息源');
    return;
  }

  // 如果指定了源名称，只测试该源
  const targetSources = sourceName
    ? sources.filter(s => s.name === sourceName)
    : sources;

  if (targetSources.length === 0) {
    console.log(`未找到信息源: ${sourceName}`);
    return;
  }

  console.log(`准备测试 ${targetSources.length} 个信息源\n`);

  for (const source of targetSources) {
    const articles = await fetchSource(source, dataDir);

    if (articles.length > 0) {
      console.log(`\n预览前 3 篇文章：`);
      for (const article of articles.slice(0, 3)) {
        console.log(`  - ${article.title}`);
        console.log(`    ${article.url}`);
      }
    }
  }

  console.log('\n测试完成！');
}

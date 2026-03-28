#!/usr/bin/env node
/**
 * add 命令：添加信息源
 */

import { loadSources, saveSources } from '../core/storage.mjs';

export async function add(dataDir, sourceConfig) {
  const sources = await loadSources(dataDir);

  // 检查是否已存在同名源
  if (sources.some(s => s.name === sourceConfig.name)) {
    console.log(`信息源 "${sourceConfig.name}" 已存在`);
    return;
  }

  // 添加新源
  sources.push(sourceConfig);
  await saveSources(dataDir, sources);

  console.log(`✓ 已添加信息源: ${sourceConfig.name}`);
  console.log(`  类型: ${sourceConfig.type}`);
  console.log('\n运行 /feeds check 测试抓取');
}

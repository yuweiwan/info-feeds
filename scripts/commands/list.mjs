#!/usr/bin/env node
/**
 * list 命令：列出所有信息源
 */

import { loadSources, loadState } from '../core/storage.mjs';

export async function list(dataDir) {
  const sources = await loadSources(dataDir);
  const state = await loadState(dataDir);

  if (sources.length === 0) {
    console.log('没有配置任何信息源');
    return;
  }

  console.log(`共 ${sources.length} 个信息源:\n`);

  for (const source of sources) {
    const sourceState = state[source.name];
    const status = sourceState?.error_count >= 3 ? '❌ 已禁用' : '✓ 正常';

    console.log(`${status} ${source.name}`);
    console.log(`  类型: ${source.type}`);

    if (sourceState) {
      console.log(`  上次抓取: ${sourceState.last_fetch || '从未'}`);
      if (sourceState.error_count > 0) {
        console.log(`  错误次数: ${sourceState.error_count}`);
      }
    }
    console.log();
  }
}

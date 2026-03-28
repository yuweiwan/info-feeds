#!/usr/bin/env node
/**
 * 主抓取逻辑
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { generateArticleId } from '../fetchers/utils.mjs';
import {
  loadSources,
  loadState,
  updateSourceState,
  recordSourceError,
  saveArticleMemory
} from './storage.mjs';
import { filterNewArticles } from './dedup.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 执行抓取脚本
 */
async function executeFetcher(fetcherPath, config) {
  return new Promise((resolve, reject) => {
    const configJson = JSON.stringify(config);
    const child = spawn('node', [fetcherPath, configJson], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`抓取失败: ${stderr}`));
      } else {
        try {
          const articles = JSON.parse(stdout);
          resolve(articles);
        } catch (error) {
          reject(new Error(`解析输出失败: ${error.message}`));
        }
      }
    });
  });
}

/**
 * 抓取单个源
 */
export async function fetchSource(source, dataDir) {
  console.log(`\n[${source.name}] 开始抓取...`);

  // 检查源是否被禁用
  const state = await loadState(dataDir);
  const sourceState = state[source.name];
  if (sourceState && sourceState.error_count >= 3) {
    console.log(`[${source.name}] 已禁用（连续失败 ${sourceState.error_count} 次）`);
    return [];
  }

  try {
    // 构造 fetcher 路径
    const fetcherPath = path.join(__dirname, '../fetchers', `${source.type}.mjs`);

    // 执行抓取
    const articles = await executeFetcher(fetcherPath, source.config);
    console.log(`[${source.name}] 抓取到 ${articles.length} 篇文章`);

    // 过滤新文章
    const newArticles = await filterNewArticles(articles, source.name, dataDir);
    console.log(`[${source.name}] 其中 ${newArticles.length} 篇是新文章`);

    // 更新状态
    if (articles.length > 0) {
      const latestId = generateArticleId(articles[0].url);
      await updateSourceState(dataDir, source.name, latestId);
    }

    return newArticles.map(a => ({ ...a, source: source.name }));
  } catch (error) {
    console.error(`[${source.name}] 抓取失败: ${error.message}`);
    await recordSourceError(dataDir, source.name);
    return [];
  }
}

/**
 * 抓取所有源
 */
export async function fetchAll(dataDir) {
  const sources = await loadSources(dataDir);

  if (sources.length === 0) {
    console.log('没有配置任何信息源');
    return [];
  }

  const allArticles = [];

  // 串行抓取（避免并发过多）
  for (const source of sources) {
    const articles = await fetchSource(source, dataDir);
    allArticles.push(...articles);
  }

  return allArticles;
}

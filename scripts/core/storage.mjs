#!/usr/bin/env node
/**
 * 本地存储管理模块
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

/**
 * 加载配置文件
 */
export async function loadConfig(dataDir) {
  const configPath = path.join(dataDir, 'config.yaml');
  try {
    const content = await fs.readFile(configPath, 'utf8');
    return YAML.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`配置文件不存在: ${configPath}\n请先运行 /feeds setup 初始化配置`);
    }
    throw error;
  }
}

/**
 * 保存配置文件
 */
export async function saveConfig(dataDir, config) {
  const configPath = path.join(dataDir, 'config.yaml');
  await fs.writeFile(configPath, YAML.stringify(config), 'utf8');
}

/**
 * 加载信息源列表
 */
export async function loadSources(dataDir) {
  const sourcesPath = path.join(dataDir, 'sources.yaml');
  try {
    const content = await fs.readFile(sourcesPath, 'utf8');
    const data = YAML.parse(content);
    return data.sources || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * 保存信息源列表
 */
export async function saveSources(dataDir, sources) {
  const sourcesPath = path.join(dataDir, 'sources.yaml');
  await fs.writeFile(sourcesPath, YAML.stringify({ sources }), 'utf8');
}

/**
 * 加载分类配置
 */
export async function loadCategories(dataDir) {
  const categoriesPath = path.join(dataDir, 'categories.yaml');
  try {
    const content = await fs.readFile(categoriesPath, 'utf8');
    return YAML.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 返回默认分类
      return {
        core_categories: ['AI研究', '投融资', '产品发布', '技术教程', '开源项目', '其他'],
        sub_categories: {}
      };
    }
    throw error;
  }
}

/**
 * 加载状态文件
 */
export async function loadState(dataDir) {
  const statePath = path.join(dataDir, 'state.json');
  try {
    const content = await fs.readFile(statePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

/**
 * 保存状态文件
 */
export async function saveState(dataDir, state) {
  const statePath = path.join(dataDir, 'state.json');
  await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * 更新源的状态
 */
export async function updateSourceState(dataDir, sourceName, latestArticleId) {
  const state = await loadState(dataDir);
  state[sourceName] = {
    last_fetch: new Date().toISOString(),
    latest_article_id: latestArticleId,
    last_success: new Date().toISOString(),
    error_count: 0
  };
  await saveState(dataDir, state);
}

/**
 * 记录源的错误
 */
export async function recordSourceError(dataDir, sourceName) {
  const state = await loadState(dataDir);
  if (!state[sourceName]) {
    state[sourceName] = { error_count: 0 };
  }
  state[sourceName].error_count = (state[sourceName].error_count || 0) + 1;
  state[sourceName].last_error = new Date().toISOString();
  await saveState(dataDir, state);
}

/**
 * 加载源的记忆
 */
export async function loadSourceMemory(dataDir, sourceName) {
  const memoryPath = path.join(dataDir, 'memories', `${sourceName}.json`);
  try {
    const content = await fs.readFile(memoryPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * 保存文章记忆
 */
export async function saveArticleMemory(dataDir, sourceName, memory) {
  const memoryPath = path.join(dataDir, 'memories', `${sourceName}.json`);

  // 确保目录存在
  await fs.mkdir(path.dirname(memoryPath), { recursive: true });

  // 加载现有记忆
  const existing = await loadSourceMemory(dataDir, sourceName);

  // 添加新记忆
  existing.push(memory);

  // 保存
  await fs.writeFile(memoryPath, JSON.stringify(existing, null, 2), 'utf8');
}

/**
 * 加载所有记忆
 */
export async function loadAllMemories(dataDir) {
  const memoriesDir = path.join(dataDir, 'memories');
  try {
    const files = await fs.readdir(memoriesDir);
    const allMemories = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const sourceName = file.replace('.json', '');
        const memories = await loadSourceMemory(dataDir, sourceName);
        allMemories.push(...memories);
      }
    }

    return allMemories;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * 生成每日摘要
 */
export async function saveDailyDigest(dataDir, date, articles) {
  const dateStr = date.toISOString().split('T')[0];
  const digestDir = path.join(dataDir, 'daily', dateStr);
  await fs.mkdir(digestDir, { recursive: true });

  const digestPath = path.join(digestDir, 'digest.json');

  // 按分类统计
  const byCategory = {};
  for (const article of articles) {
    byCategory[article.category] = (byCategory[article.category] || 0) + 1;
  }

  const digest = {
    date: dateStr,
    total_articles: articles.length,
    by_category: byCategory,
    articles
  };

  await fs.writeFile(digestPath, JSON.stringify(digest, null, 2), 'utf8');
}

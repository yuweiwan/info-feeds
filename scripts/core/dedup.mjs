#!/usr/bin/env node
/**
 * 去重与状态追踪模块
 */

import { generateArticleId } from '../fetchers/utils.mjs';
import { loadState, loadSourceMemory } from './storage.mjs';

/**
 * 判断文章是否应该被处理
 */
export async function shouldProcessArticle(article, sourceName, dataDir) {
  const articleId = generateArticleId(article.url);

  // 1. 检查是否已在该源的记忆中
  const sourceMemory = await loadSourceMemory(dataDir, sourceName);
  if (sourceMemory.some(m => m.id === articleId)) {
    return false; // 已处理过
  }

  // 2. 检查文章时间
  const state = await loadState(dataDir);
  const sourceState = state[sourceName];

  if (!sourceState) {
    // 新源：只处理最近 7 天的文章
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const articleTime = new Date(article.time);
    return articleTime > sevenDaysAgo;
  }

  // 已有源：只处理新文章（在上次抓取之后的）
  const lastFetch = new Date(sourceState.last_fetch);
  const articleTime = new Date(article.time);
  return articleTime > lastFetch;
}

/**
 * 过滤出需要处理的文章
 */
export async function filterNewArticles(articles, sourceName, dataDir) {
  const newArticles = [];

  for (const article of articles) {
    if (await shouldProcessArticle(article, sourceName, dataDir)) {
      newArticles.push(article);
    }
  }

  return newArticles;
}

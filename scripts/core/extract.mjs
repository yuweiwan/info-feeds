#!/usr/bin/env node
/**
 * AI 提取模块
 *
 * 注意：这个模块需要在 Claude Code 环境中运行
 * 它会输出 prompt，由 SKILL.md 指引 Claude 执行提取
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 构造 AI 提取 prompt
 */
export async function buildExtractionPrompt(article, categories) {
  // 读取 prompt 模板
  const templatePath = path.join(__dirname, '../../references/prompts/extraction.md');
  let template = await fs.readFile(templatePath, 'utf8');

  // 替换占位符
  template = template.replace('{{TITLE}}', article.title);
  template = template.replace('{{URL}}', article.url);
  template = template.replace('{{TIME}}', article.time);
  template = template.replace('{{CONTENT}}', article.content || '（无正文）');

  // 构造分类列表
  const categoryList = categories.core_categories
    .map(c => `- ${c}`)
    .join('\n');
  template = template.replace('{{CATEGORIES}}', categoryList);

  return template;
}

/**
 * 解析 AI 提取结果
 */
export function parseExtractionResult(jsonString) {
  try {
    const result = JSON.parse(jsonString);

    // 验证必需字段
    if (!result.category) {
      result.category = '[其他]';
    }
    if (!result.entities) {
      result.entities = [];
    }
    if (!result.summary) {
      result.summary = '无摘要';
    }

    return result;
  } catch (error) {
    // 解析失败，返回默认值
    return {
      category: '[其他]',
      entities: [],
      summary: '提取失败'
    };
  }
}

/**
 * 批量提取（用于 CLI 模式）
 *
 * 这个函数会输出所有需要提取的文章信息
 * 然后等待 Claude 返回提取结果
 */
export async function batchExtract(articles, categories) {
  const prompts = [];

  for (const article of articles) {
    const prompt = await buildExtractionPrompt(article, categories);
    prompts.push({
      article_id: article.url,
      prompt
    });
  }

  return prompts;
}

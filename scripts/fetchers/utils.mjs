#!/usr/bin/env node
/**
 * 共享工具函数
 */

import crypto from 'node:crypto';
import nodeFetch from 'node-fetch';

// 导出可用的 fetch（Node 24 原生 fetch 有 HTTPS 问题，使用 node-fetch）
export const fetch = nodeFetch;

/**
 * 生成文章唯一 ID（URL 的 SHA256 哈希前 16 位）
 */
export function generateArticleId(url) {
  return crypto.createHash('sha256')
    .update(url)
    .digest('hex')
    .substring(0, 16);
}

/**
 * 标准化日期为 ISO 8601 格式
 */
export function normalizeDate(date) {
  if (!date) return new Date().toISOString();

  // 如果已经是 ISO 格式（有 T 且在正确位置）
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(date)) {
    return date;
  }

  // RFC 2822 格式（如 "Fri, 27 Mar 2026 08:35:54 GMT"）
  if (typeof date === 'string' && /^[A-Z][a-z]{2},?\s+\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}\s+\d{2}:\d{2}:\d{2}/.test(date)) {
    return new Date(date).toISOString();
  }

  // Unix 时间戳（秒）
  if (typeof date === 'number' && date < 10000000000) {
    return new Date(date * 1000).toISOString();
  }

  // Unix 时间戳（毫秒）
  if (typeof date === 'number') {
    return new Date(date).toISOString();
  }

  // 其他格式尝试解析
  return new Date(date).toISOString();
}

/**
 * 从 stdin 读取 JSON 配置
 */
export async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * 安全地解析 JSON
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * 截断文本到指定长度
 */
export function truncate(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

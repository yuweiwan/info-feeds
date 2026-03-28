#!/usr/bin/env node
/**
 * 导入 BestBlogs RSS 源
 */

import { readFileSync } from 'node:fs';
import { parseStringPromise } from 'xml2js';

const opmlPath = process.argv[2] || '/tmp/bestblogs.opml';

const opmlContent = readFileSync(opmlPath, 'utf8');
const parsed = await parseStringPromise(opmlContent);

const sources = [];

function extractOutlines(outlines, category = '') {
  for (const outline of outlines) {
    if (outline.outline) {
      // 递归处理子节点
      const childCategory = outline.$.text || category;
      extractOutlines(outline.outline, childCategory);
    } else if (outline.$ && outline.$.xmlUrl) {
      const source = {
        name: outline.$.title || outline.$.text || 'Unknown',
        type: 'rss',
        config: {
          url: outline.$.xmlUrl,
          limit: 20
        },
        metadata: {
          title: outline.$.title || outline.$.text || 'Unknown',
          htmlUrl: outline.$.htmlUrl || '',
          category: category
        }
      };
      sources.push(source);
    }
  }
}

if (parsed.opml && parsed.opml.body && parsed.opml.body[0] && parsed.opml.body[0].outline) {
  extractOutlines(parsed.opml.body[0].outline);
}

// 输出 YAML 格式
const yaml = sources.map(s => `  - name: ${s.name}
    type: rss
    config:
      url: ${s.config.url}
      limit: 20
    metadata:
      title: ${s.metadata.title}
      htmlUrl: ${s.metadata.htmlUrl}
      category: ${s.metadata.category}`).join('\n');

console.log(yaml);

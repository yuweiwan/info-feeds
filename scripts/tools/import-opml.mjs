#!/usr/bin/env node
/**
 * OPML 导入工具
 *
 * 解析 OPML 文件并生成 sources.yaml 配置
 */

import fs from 'node:fs/promises';
import { parseString } from 'xml2js';
import YAML from 'yaml';

async function parseOPML(opmlPath) {
  const content = await fs.readFile(opmlPath, 'utf8');

  return new Promise((resolve, reject) => {
    parseString(content, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      const sources = [];
      const outlines = result.opml.body[0].outline || [];

      for (const outline of outlines) {
        const attrs = outline.$;
        if (attrs && attrs.type === 'rss' && attrs.xmlUrl) {
          // 生成安全的源名称（移除特殊字符）
          const safeName = attrs.text
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase();

          sources.push({
            name: safeName,
            type: 'rss',
            config: {
              url: attrs.xmlUrl,
              limit: 20
            },
            metadata: {
              title: attrs.text,
              htmlUrl: attrs.htmlUrl
            }
          });
        }
      }

      resolve(sources);
    });
  });
}

async function importOPML(opmlPath, outputPath) {
  console.log(`正在解析 OPML 文件: ${opmlPath}`);

  const sources = await parseOPML(opmlPath);

  console.log(`找到 ${sources.length} 个 RSS 源`);

  // 生成 sources.yaml
  const config = {
    sources: sources
  };

  const yamlContent = YAML.stringify(config);
  await fs.writeFile(outputPath, yamlContent, 'utf8');

  console.log(`已生成配置文件: ${outputPath}`);
  console.log(`\n前 5 个源:`);
  sources.slice(0, 5).forEach(s => {
    console.log(`  - ${s.metadata.title} (${s.name})`);
  });

  return sources;
}

// CLI 入口
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const opmlPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!opmlPath || !outputPath) {
    console.error('用法: node import-opml.mjs <opml文件> <输出文件>');
    console.error('示例: node import-opml.mjs feeds.opml sources.yaml');
    process.exit(1);
  }

  try {
    await importOPML(opmlPath, outputPath);
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

export { parseOPML, importOPML };

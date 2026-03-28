#!/usr/bin/env node
/**
 * refs 命令：查看参考文档
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AVAILABLE_REFS = [
  {
    name: 'sources-catalog',
    description: '可用的信息源类型及配置参数',
    file: 'sources-catalog.md'
  },
  {
    name: 'categories',
    description: '分类体系说明',
    file: 'categories.md'
  },
  {
    name: 'entity-types',
    description: '实体关系类型说明',
    file: 'entity-types.md'
  },
  {
    name: 'extraction',
    description: 'AI 提取 prompt 模板',
    file: 'prompts/extraction.md'
  }
];

export async function refs(refName) {
  if (!refName) {
    console.log('可用参考文档：\n');
    for (const ref of AVAILABLE_REFS) {
      console.log(`  /feeds refs ${ref.name}`);
      console.log(`    ${ref.description}\n`);
    }
    return;
  }

  const ref = AVAILABLE_REFS.find(r => r.name === refName);
  if (!ref) {
    console.error(`未知文档: ${refName}`);
    console.error('运行 /feeds refs 查看可用文档');
    process.exit(1);
  }

  const refsDir = path.join(__dirname, '../../references');
  const filePath = path.join(refsDir, ref.file);

  try {
    const content = await fs.readFile(filePath, 'utf8');
    console.log(content);
  } catch (error) {
    console.error(`无法读取文档: ${error.message}`);
    process.exit(1);
  }
}

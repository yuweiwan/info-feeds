#!/usr/bin/env node
/**
 * setup 命令：初始化配置
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setup(dataDir) {
  console.log(`初始化配置目录: ${dataDir}\n`);

  // 创建目录结构
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.join(dataDir, 'memories'), { recursive: true });
  await fs.mkdir(path.join(dataDir, 'daily'), { recursive: true });

  // 复制模板文件
  const templatesDir = path.join(__dirname, '../../templates');

  const templates = [
    'config.yaml.template',
    'sources.yaml.template',
    'categories.yaml.template'
  ];

  for (const template of templates) {
    const srcPath = path.join(templatesDir, template);
    const destPath = path.join(dataDir, template.replace('.template', ''));

    // 检查目标文件是否已存在
    try {
      await fs.access(destPath);
      console.log(`✓ ${template.replace('.template', '')} 已存在，跳过`);
    } catch {
      // 文件不存在，复制模板
      await fs.copyFile(srcPath, destPath);
      console.log(`✓ 创建 ${template.replace('.template', '')}`);
    }
  }

  // 创建空的 state.json
  const statePath = path.join(dataDir, 'state.json');
  try {
    await fs.access(statePath);
    console.log(`✓ state.json 已存在，跳过`);
  } catch {
    await fs.writeFile(statePath, '{}', 'utf8');
    console.log(`✓ 创建 state.json`);
  }

  console.log('\n初始化完成！');
  console.log('\n下一步：');
  console.log(`1. 编辑 ${path.join(dataDir, 'config.yaml')} 配置数据目录`);
  console.log(`2. 编辑 ${path.join(dataDir, 'sources.yaml')} 添加信息源`);
  console.log(`3. 运行 /feeds check 测试抓取`);
}

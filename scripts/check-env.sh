#!/usr/bin/env bash
# Feeds Skill 环境检查

set -e

echo "=== Feeds Skill 环境检查 ==="
echo ""

# Node.js 版本检查
if command -v node &>/dev/null; then
  NODE_VER=$(node --version 2>/dev/null)
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ] 2>/dev/null; then
    echo "✓ Node.js: $NODE_VER"
  else
    echo "✗ Node.js: $NODE_VER (需要 18+)"
    exit 1
  fi
else
  echo "✗ Node.js: 未安装"
  echo "  请安装 Node.js 18+ 版本"
  exit 1
fi

# 检查依赖是否安装
SKILL_DIR="$HOME/.claude/skills/feeds"
if [ ! -d "$SKILL_DIR/node_modules" ]; then
  echo "✗ 依赖: 未安装"
  echo "  运行: cd $SKILL_DIR && npm install"
  exit 1
else
  echo "✓ 依赖: 已安装"
fi

# 检查数据目录（如果提供）
if [ -n "$1" ]; then
  DATA_DIR="$1"
  if [ ! -d "$DATA_DIR" ]; then
    echo "✗ 数据目录: $DATA_DIR 不存在"
    echo "  运行: /feeds setup --data-dir $DATA_DIR"
    exit 1
  fi

  # 检查配置文件
  if [ ! -f "$DATA_DIR/config.yaml" ]; then
    echo "✗ 配置: config.yaml 不存在"
    exit 1
  fi
  echo "✓ 数据目录: $DATA_DIR"
  echo "✓ 配置文件: 已就绪"
fi

echo ""
echo "=== 环境检查通过 ==="

# Project: PDF Watermark Chrome Extension

## Overview
一个纯客户端的 Chrome 浏览器插件，让用户在本地为 PDF 文件添加文字水印。所有处理在浏览器内完成，文件不上传到任何服务器，保证隐私。形态参考现有的两个 Python 脚本（`watermark_cn.py` / `watermark_en.py`），但完全用 JavaScript 重写。

## Goals
- 提供比命令行更友好的交互：拖拽即用，所见即所得
- 完全本地处理，不依赖后端
- 中英文水印都开箱可用（内嵌 CJK 字体）
- 单页弹窗（popup）即可完成全部操作
- **正式上架 Chrome Web Store**（不是只供本地开发者模式加载）

## Target Users
- 个人用户：给发票、合同、文档加个人/机构标识水印
- 不愿意上传敏感 PDF 到在线水印工具的用户
- 偏好图形界面、不想跑 Python 脚本的用户

## Core Features
- [ ] 拖拽 / 选择本地 PDF 文件
- [ ] 输入水印文字（支持中英文混排）
- [ ] 可调参数：透明度、旋转角度、字号、颜色
- [ ] 位置预设三档：单点居中 / 2×2 网格（默认）/ 3×3 网格
- [ ] 实时预览：首页缩略图叠加水印，参数调整即时反映
- [ ] 点击「下载」生成带水印的 PDF（文件名加 `_watermarked` 后缀）
- [ ] 处理多页 PDF，每页都加水印
- [ ] 中文字体子集化（GB2312 一级+二级，~2.5MB）

## Nice-to-Have
- [ ] 图片水印（上传 PNG / Logo）
- [ ] 页码范围选择（只对特定页加水印）
- [ ] 批量处理多个 PDF
- [ ] 保存常用预设（水印文字 + 参数组合）
- [ ] 右键菜单：在浏览器内直接对 PDF 链接加水印

## Constraints
- Chrome Manifest V3
- 纯前端，无后端服务
- 单文件 PDF 大小不超过浏览器内存能处理的范围（一般 ~100MB 内）
- 中文字体内嵌后插件总体积控制在 ~10MB 以内
- **必须满足 Chrome Web Store 审核要求**：
  - 权限最小化（manifest 中 `permissions` 留空或仅必需项）
  - 无远程代码加载（所有 JS / WASM 打包进扩展）
  - Single Purpose 合规（仅做 PDF 水印一件事）
  - 提供公开的隐私政策 URL

## Acceptance Criteria
- 能在 Chrome 中加载（开发者模式）并打开 popup
- 拖入一个中英文混排的多页 PDF，输入水印文字「DRAFT / 示例公司」
- 调整透明度（默认 0.3）、角度（默认 30°）、字号（默认 60）
- 下载后用任意 PDF 阅读器打开，每页 4 处水印按 2×2 网格分布、对角线旋转、灰色半透明
- 原 PDF 内容完整无损，仅多出水印图层
- **Chrome Web Store 提交并通过审核**，可被任意用户搜索安装

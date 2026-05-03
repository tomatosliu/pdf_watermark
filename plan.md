# Implementation Plan

## Tech Stack
- **运行环境**：Chrome Manifest V3 扩展
- **PDF 处理**：[`pdf-lib`](https://github.com/Hopding/pdf-lib) — 在浏览器中读写 PDF
- **字体子集化**：[`@pdf-lib/fontkit`](https://github.com/Hopding/fontkit) — pdf-lib 的字体注册器，支持自定义 TTF/OTF
- **CJK 字体**：思源黑体 CN 子集（GB2312 一级 + 二级，约 6763 字，~2.5MB）
- **预览渲染**：[`pdfjs-dist`](https://github.com/mozilla/pdf.js) — 首页缩略图渲染（仅用于预览，不参与最终 PDF 生成）
- **构建工具**：Vite + `@crxjs/vite-plugin`（专为 MV3 扩展设计的打包方案）
- **语言**：TypeScript（类型安全 + 更好的 IDE 体验）
- **UI**：原生 HTML/CSS（popup 页面足够简单，不引入 React 等框架）
- **测试**：Vitest（单元测试水印生成逻辑）

## Architecture

```
┌─────────────────────────────────────┐
│         Popup (popup.html)          │
│  ┌──────────────────────────────┐   │
│  │  拖拽区 / 文件选择器          │   │
│  │  水印文字输入框              │   │
│  │  参数滑杆（透明度/角度/字号）│   │
│  │  [下载] 按钮                 │   │
│  └──────────────────────────────┘   │
│              │                       │
│              ▼                       │
│  ┌──────────────────────────────┐   │
│  │  watermark.ts (纯函数)        │   │
│  │  - loadPdf(file)              │   │
│  │  - applyWatermark(pdf, opts)  │   │
│  │  - downloadResult(bytes, name)│   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
        ↓ 使用 pdf-lib + fontkit
   全部在浏览器内存中完成，零网络请求
```

不需要 background service worker，也不需要 content script —— 所有逻辑在 popup 内完成。

## File Structure

```
pdf_watermark/
├── requirement.md
├── plan.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── manifest.json              # MV3 manifest
├── src/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts           # UI 事件绑定
│   │   └── popup.css
│   ├── lib/
│   │   ├── watermark.ts       # 核心水印逻辑
│   │   └── fonts.ts           # 字体加载与子集化
│   └── assets/
│       ├── icon-16.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── fonts/
│           └── SourceHanSansCN-subset.ttf  # 中文字体子集
└── tests/
    └── watermark.test.ts
```

## Milestones

### Milestone 1: 项目脚手架与最小可行扩展
- [ ] 初始化 npm 项目，安装依赖（pdf-lib、fontkit、vite、@crxjs/vite-plugin、TypeScript）
- [ ] 编写 `manifest.json`（MV3，permissions 仅需空数组，不访问任何网页）
- [ ] 编写最简 `popup.html`：一个文件输入框 + 一个下载按钮
- [ ] 在 Chrome 开发者模式加载扩展，验证 popup 能打开

### Milestone 2: 英文水印（对齐 watermark_en.py）
- [ ] 实现 `loadPdf(file: File): Promise<PDFDocument>`
- [ ] 实现 `applyWatermark(pdf, { text, alpha, angle, fontSize })`，使用 pdf-lib 内置 Helvetica
- [ ] 2×2 网格布局，旋转 30°，灰色 RGB(0.4, 0.4, 0.4)，alpha 0.3
- [ ] 实现下载：触发浏览器 download，文件名加 `_watermarked` 后缀
- [ ] 用一个英文 PDF 端到端验证

### Milestone 3: 中文水印（对齐 watermark_cn.py）
- [ ] 准备思源黑体 CN 字体子集：覆盖 **GB2312 一级 + 二级（约 6763 字）**，用 `fonttools pyftsubset` 生成，目标体积 ~2.5MB
- [ ] 通过 `@pdf-lib/fontkit` 注册该 TTF
- [ ] 自动检测水印文字是否含 CJK 字符，决定使用 Helvetica 还是思源黑体
- [ ] 端到端验证「示例公司」「DRAFT」两种水印都正常

### Milestone 4: UI 完善 + 实时预览
- [ ] 拖拽上传（drag & drop API）
- [ ] 参数控件：透明度 / 角度 / 字号 滑杆，颜色选择器
- [ ] **位置预设三档**：单点居中 / 2×2 网格（默认）/ 3×3 网格
- [ ] **实时预览**：用 pdfjs 渲染首页缩略图到 canvas，水印用 CSS transform 叠加层模拟（不走 pdf-lib），参数变化即时反映；点「下载」时才真正调 pdf-lib 生成 PDF
- [ ] 处理中状态指示（按钮 loading、进度提示）
- [ ] 错误处理：非 PDF 文件、加密 PDF、过大文件

### Milestone 5: 打包构建
- [ ] 添加图标（16/48/128 三种尺寸；CWS 提交还需要 128×128 高清版）
- [ ] 写 README（安装方式、使用截图）
- [ ] `vite build` 产出 `dist/`，验证可作为已打包扩展加载
- [ ] 用真实 PDF 跑端到端冒烟测试（中文、英文、混排、多页、加密 PDF 错误处理）

### Milestone 6: Chrome Web Store 上架
- [ ] 注册 Chrome Web Store 开发者账号（$5 一次性费用）
- [ ] 准备应用素材：
  - [ ] 128×128 高清图标
  - [ ] 至少 1 张 1280×800 截图（建议 3-5 张展示核心流程）
  - [ ] 短描述（≤132 字符）+ 详细描述（中英双语）
  - [ ] Logo / 营销图（可选但建议）
- [ ] 撰写隐私政策页面并托管（可放 GitHub Pages，内容核心：「不收集任何用户数据，所有 PDF 处理在浏览器本地完成」）
- [ ] 审核 manifest：
  - [ ] permissions 留空（无需 storage / tabs / activeTab 等）
  - [ ] 确认无远程代码加载（所有 import 来自 bundle）
  - [ ] `description` 字段清晰说明单一用途
- [ ] 打包 .zip 上传到 CWS dashboard
- [ ] 填写商品详情、分类（生产力工具）、定价（免费）、地区
- [ ] 提交审核，跟进可能的 reject 反馈并修复
- [ ] 审核通过后公开发布，验证可被搜索安装

## Resolved Decisions
- **中文字体子集**：GB2312 一级 + 二级，约 6763 字，~2.5MB
- **自定义字体上传**：暂不支持，内嵌思源黑体已覆盖 99% 场景
- **位置预设**：三档 —— 单点居中 / 2×2 网格（默认）/ 3×3 网格
- **实时预览**：做，pdfjs 渲染首页缩略图 + CSS transform 叠加水印，下载时才走 pdf-lib
- **发布渠道**：正式上架 Chrome Web Store（M6），不止于本地开发者模式

# Marble

「AI 写、你看」的桌面笔记应用：你只在右侧对 AI 说话，AI 写出**完整 HTML 网页**，
**直接渲染在中间**只读展示区；左侧是这些 AI 文档的列表。基于 Electron，
AI 接入 [Agnes](https://agnes-ai.com/) 免费 API（OpenAI 兼容）。

## 运行（开发）

```bash
npm install      # 安装依赖（Electron）
npm start        # 启动应用
```

首次启动会让你选择一个文件夹作为「笔记库（vault）」，之后每篇笔记都是该文件夹里的真实 `.html` 文件。

## 用法

1. 点左上角 ＋ 新建一篇（或直接在右侧发指令，会自动新建）
2. 右侧对 AI 说「写一篇关于 X 的笔记」「再短一点」「加一节定价」……
3. AI 生成的 HTML 实时渲染在中间，并写回当前 `.html` 文件
4. 设置 → AI 填入 Agnes API Key（接口地址 `https://apihub.agnes-ai.com/v1`、模型 `agnes-2.0-flash` 已预填）

## 配置 AI

去 https://agnes-ai.com/ 注册获取免费 API Key，填到「设置 → AI」。可点「拉取可用模型」列出账号下所有模型。

## 打包成 Windows 安装包

```bash
npm run dist     # 产物在 dist/
```

## 目录结构

```
src/
  main/        Electron 主进程
    main.js    入口 + IPC
    preload.js 安全桥（window.api）
    config.js  配置（vault 路径 / API Key）
    vault.js   笔记库文件操作（读写 .html）
    ai.js      Agnes 流式请求（产出 HTML）
  renderer/    界面（在 WebView 渲染）
    index.html 三栏布局 + 设置弹窗
    styles/    样式
    js/
      state.js    全局状态
      editor.js   中间只读 HTML 渲染（沙箱 iframe）
      filetree.js 左侧文件树
      ai.js       右侧 AI 面板（指令 -> 写 HTML -> 渲染 -> 落盘）
      settings.js 设置（AI 配置 / 关于）
      app.js      启动与按钮绑定
scripts/       gen-build-info.js（生成构建时间，供「关于」页）
```

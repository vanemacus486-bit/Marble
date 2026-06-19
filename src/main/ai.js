// 调用 Agnes（OpenAI Chat Completions 兼容）的流式对话。
// 在主进程里用 Node 的全局 fetch 发请求，所以没有浏览器跨域（CORS）问题。

const SYSTEM_PROMPT = [
  '你是 Marble 笔记应用的 AI 写作引擎。用户通过对话让你撰写或修改一篇笔记，这篇笔记是一个 HTML 文档。',
  '严格遵守：',
  '1. 永远只输出**一个完整、自包含的 HTML 文档**（含 <!doctype html>、<head> 内的 <style> 内联样式）。',
  '2. 绝对不要使用 Markdown，不要用 ``` 代码围栏包裹，不要任何解释性文字或开场白——只输出 HTML 源码本身。',
  '3. 排版要美观、适合阅读：合理的标题层级、舒适的行距、正文最大宽度约 760px 居中、浅色背景深色文字。',
  '4. 如果下面给了「当前文档」，说明用户要在它的基础上修改，请基于它改动并返回**完整的新 HTML**（不是片段、不是 diff、不要只给改动部分）。',
  '5. 用户用中文，正文也用中文。',
  '6. 你可以用 [[笔记标题]] 语法来引用其他笔记，例如：参见 [[火星探索]]。图谱会自动识别这种链接。同时也可以用 <a href="笔记标题.html">链接文字</a> 标准 HTML 链接。',
].join('\n');

// HTML 生成风格 → prompt 文本映射
const HTML_STYLE_PROMPTS = {
  clean: '排版美观适合阅读：合理的标题层级、舒适的行距 1.7、正文最大宽度约 760px 居中、白色背景深色文字。',
  paper: '页面采用米黄或暖白底色、深灰文字，正文最大宽度 720px 居中，行距 1.8，使用衬线或暖色字体，营造纸张般的温暖阅读感。',
  dark: '页面采用深色背景（深灰或深蓝黑），浅色文字（浅灰或米白），正文最大宽度 760px 居中，整体低对比度、柔和，适合夜间阅读。代码块用稍亮的底色衬托。',
  elegant: '极简风格，大量留白，正文最大宽度 700px 居中，行距 1.9，标题用细体或衬线，配色克制——黑白灰为主、点缀单个低饱和色，排版呼吸感强。',
  tech: '现代科技风格，深色背景（类似代码编辑器），蓝色或青色作为强调色，正文最大宽度 800px，代码块用圆角背景加等宽字体，有清晰的信息层级和卡片式布局。',
};

function buildMessages({ history, context, writing }) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  // HTML 生成风格
  const htmlStyle = (writing && writing.htmlStyle) || 'clean';
  const stylePrompt = HTML_STYLE_PROMPTS[htmlStyle];
  if (stylePrompt) {
    messages.push({
      role: 'system',
      content: '当前笔记的默认排版风格（务必遵守——风格优先于其他规则第 3 条）：\n' + stylePrompt,
    });
  }
  // 用户自定义系统提示词
  if (writing && writing.stylePrompt && writing.stylePrompt.trim()) {
    messages.push({
      role: 'system',
      content: '用户的默认写作偏好（在不与具体指令冲突时务必遵守）：\n' + writing.stylePrompt.trim(),
    });
  }
  if (context && context.content && context.content.trim()) {
    messages.push({
      role: 'system',
      content:
        `当前文档《${context.name || '未命名'}》已有如下 HTML，请在它的基础上按用户要求修改，` +
        `并返回完整的新 HTML：\n\n${context.content}`,
    });
  }
  for (const m of history) {
    if (m && (m.role === 'user' || m.role === 'assistant') && m.content) {
      messages.push({ role: m.role, content: m.content });
    }
  }
  return messages;
}

// onDelta(text) 会在每收到一段增量时被调用；返回完整回答文本。
async function streamChat({ ai, writing, history, context }, onDelta) {
  if (!ai || !ai.apiKey) {
    throw new Error('尚未配置 API Key，请到「设置 → 模型」填写。');
  }
  const baseUrl = (ai.baseUrl || '').replace(/\/$/, '');
  const url = `${baseUrl}/chat/completions`;
  const body = {
    model: ai.model || 'agnes-2.0-flash',
    messages: buildMessages({ history, context, writing }),
    stream: true,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ai.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`请求失败（HTTP ${res.status}）${errText ? '：' + errText.slice(0, 300) : ''}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // 最后一行可能不完整，留到下次
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices && json.choices[0] && json.choices[0].delta;
        const piece = delta && delta.content;
        if (piece) {
          full += piece;
          onDelta(piece);
        }
      } catch {
        // 忽略无法解析的行
      }
    }
  }
  return full;
}

// 拉取网关上可用的模型列表（OpenAI 兼容的 GET /models）
async function listModels({ baseUrl, apiKey }) {
  if (!apiKey) {
    throw new Error('尚未配置 API Key，请先在「配置」里填写。');
  }
  const base = (baseUrl || '').replace(/\/$/, '');
  const res = await fetch(`${base}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`获取模型失败（HTTP ${res.status}）${errText ? '：' + errText.slice(0, 300) : ''}`);
  }
  const json = await res.json();
  const data = json.data || json.models || [];
  return data
    .map((m) => (typeof m === 'string' ? m : m && m.id))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

module.exports = { streamChat, listModels };

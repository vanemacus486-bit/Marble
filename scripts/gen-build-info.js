// 在启动/打包前自动生成构建信息，供「关于」页读取。
const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const outPath = path.join(__dirname, '..', 'src', 'renderer', 'build-info.json');

const info = {
  version: pkg.version,
  buildTime: new Date().toISOString(),
};

fs.writeFileSync(outPath, JSON.stringify(info, null, 2), 'utf8');
console.log('[build-info] 已生成', outPath, info);

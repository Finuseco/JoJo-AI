'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');

// Resolve only inside an immutable published revision. Missing assets and API calls
// must remain 404s instead of receiving HTML with a misleading success status.
async function resolveStaticFile(root, pathname, { spa = false, accept = '' } = {}) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (!decoded.startsWith('/') || /[\\\x00-\x1f:]/.test(decoded)) return null;
  const parts = decoded.split('/').filter(Boolean);
  if (parts.some(part => part === '.' || part === '..' || part.startsWith('.'))) return null;
  const relative = parts.join('/');
  const candidates = relative ? [relative, `${relative}/index.html`] : ['index.html'];
  if (relative && !path.posix.extname(relative)) candidates.push(`${relative}.html`);
  if (spa && accept.includes('text/html') && !path.posix.extname(relative) && !/^(api|\.well-known)(\/|$)/i.test(relative)) candidates.push('index.html');
  const realRoot = await fs.realpath(root);
  for (const candidate of candidates) {
    try {
      const real = await fs.realpath(path.join(root, candidate));
      if (!real.startsWith(realRoot + path.sep)) continue;
      const stat = await fs.stat(real);
      if (stat.isFile() && stat.size <= 5 * 1024 * 1024) return real;
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
    }
  }
  return null;
}
module.exports = { resolveStaticFile };

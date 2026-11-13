// A static server for the package folder, so the fixture can load ../../css and ../../js as ES
// modules (browsers won't from file://). Run it alone to look at the page:
//   node test/fixture/serve.mjs   →   http://localhost:5199/test/fixture/
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

/**
 * Starts the server; resolves to its base URL and a close function. port 0 picks a free one; root
 * is the folder served (the repository, or the built site/, which has the fonts).
 */
export function serve(port = 0, root = repo) {
  const server = http.createServer((req, res) => {
    let file;
    try {
      file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    } catch {
      return res.writeHead(400).end();
    }
    const inside = path.relative(root, file);
    if (inside.startsWith('..') || path.isAbsolute(inside) || inside.split(path.sep)[0] === '.git')
      return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) =>
    server.listen(port, '127.0.0.1', () =>
      resolve({
        url: `http://127.0.0.1:${server.address().port}/test/fixture/`,
        close: () => new Promise((r) => server.close(r)),
      }),
    ),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await serve(5199);
  console.log(url);
}

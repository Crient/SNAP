import {writeFile} from 'node:fs/promises';
await writeFile('dist/_headers', '/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n');
await writeFile('dist/_redirects', '/* /index.html 200\n');

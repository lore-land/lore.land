import fs from 'fs';
import { globSync } from 'glob';

// Simple script to count unique classnames with hyphens
const htmlFiles = globSync('**/*.html', { ignore: 'node_modules/**' });
const jsFiles = globSync('**/*.mjs', { ignore: 'node_modules/**' });
const cssFiles = globSync('**/*.css', { ignore: 'node_modules/**' });

const classes = new Set();
htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/class="(.*?)"/g);
  if (matches) {
    matches.forEach(m => {
      m.replace(/class="/, '').replace(/"$/, '').split(/\s+/).forEach(c => classes.add(c));
    });
  }
});

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/class="(.*?)"/g);
  if (matches) {
    matches.forEach(m => {
      m.replace(/class="/, '').replace(/"$/, '').split(/\s+/).forEach(c => classes.add(c));
    });
  }
});

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/\.([a-z0-9-]+)/gi);
  if (matches) {
    matches.forEach(m => classes.add(m.substring(1)));
  }
});

const hyphenated = Array.from(classes).filter(c => c.includes('-'));
console.log(`Found ${hyphenated.length} hyphenated classes.`);
console.log(hyphenated.slice(0, 20).join('\n'));

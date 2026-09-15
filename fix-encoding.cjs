const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix encoding artifacts
      content = content.replace(/ǭ/g, 'á')
                       .replace(/ǧ/g, 'ú')
                       .replace(/\uFFFD/g, 'ó')
                       .replace(/Configura.es/g, 'Configurações');

      // Colors
      content = content.replace(/bg-slate-800/g, 'bg-widget')
                       .replace(/bg-slate-900/g, 'bg-app')
                       .replace(/border-slate-700/g, 'border-border')
                       .replace(/hover:bg-slate-700/g, 'hover:bg-widget-hover');
                       
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir('src');

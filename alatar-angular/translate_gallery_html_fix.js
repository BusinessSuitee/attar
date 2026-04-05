const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'src/app/pages/gallery/gallery.page.html');
let content = fs.readFileSync(htmlPath, 'utf8');

content = content.replace(
  /\{\{\s*currentSelectedImage\(\)\?\.title\s*\}\}/g,
  "{{ 'gallery_page.items.' + currentSelectedImage()?.titleKey + '.title' | transloco }}"
);

content = content.replace(
  /@if\s*\(\s*currentSelectedImage\(\)\?\.description\s*\)/g,
  "@if (currentSelectedImage()?.descKey)"
);

content = content.replace(
  /\{\{\s*currentSelectedImage\(\)\?\.description\s*\}\}/g,
  "{{ 'gallery_page.items.' + currentSelectedImage()?.descKey + '.description' | transloco }}"
);

fs.writeFileSync(htmlPath, content);
console.log('done!');

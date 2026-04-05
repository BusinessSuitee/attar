const fs = require('fs');
const path = require('path');

const tsPath = path.join(__dirname, 'src/app/pages/gallery/gallery.page.ts');
let content = fs.readFileSync(tsPath, 'utf8');

if (!content.includes('TranslocoModule')) {
    content = content.replace(
      /import { CommonModule, NgClass } from '@angular\/common';/g,
      "import { CommonModule, NgClass } from '@angular/common';\nimport { TranslocoModule } from '@jsverse/transloco';"
    );

    content = content.replace(
      /imports: \[CommonModule, NgClass\]/g,
      "imports: [CommonModule, NgClass, TranslocoModule]"
    );
    fs.writeFileSync(tsPath, content);
}
console.log('done!');

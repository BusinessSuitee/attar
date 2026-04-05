const fs = require('fs');
const path = require('path');

const tsPath = path.join(__dirname, 'src/app/pages/gallery/gallery.page.ts');
let content = fs.readFileSync(tsPath, 'utf8');

content = content.replace(/import { CommonModule, NgClass } from '@angular\/common';/, 
  "import { CommonModule, NgClass } from '@angular/common';\nimport { TranslocoModule } from '@jsverse/transloco';");
content = content.replace(/imports: \[CommonModule, NgClass\]/, 
  "imports: [CommonModule, NgClass, TranslocoModule]");

// replace titles to use transloco keys
content = content.replace(/title:\s*'„Õ’Ê· «·›—«Ê·… «·ÿ«“Ã'/, "titleKey: 'crops_1'");
content = content.replace(/description:\s*'Ì „ «·ﬁÿ«› ÌœÊÌ« ··Õ›«Ÿ ⁄·Ï À„«— «·›—«Ê·… ﬁ»· Ê’Ê·Â« ·„Õÿ«  «·›—“'/, "descKey: 'crops_1'");

content = content.replace(/title:\s*'„Õ’Ê· «·√›Êﬂ«œÊ'/, "titleKey: 'crops_2'");
content = content.replace(/description:\s*'√‘Ã«— «·√›Êﬂ«œÊ ›Ì „“«—⁄ √Ê·«œ «·⁄ÿ«—'/, "descKey: 'crops_2'");

content = content.replace(/title:\s*'«·⁄‰» «·√Õ„— ·· ’œÌ—'/, "titleKey: 'crops_3'");
content = content.replace(/description:\s*'⁄‰«ﬁÌœ «·⁄‰» ›Ì √›÷· Õ«·«  «·‰÷Ã'/, "descKey: 'crops_3'");

content = content.replace(/title:\s*'„Õ’Ê· «·»ÿ«ÿ«'/, "titleKey: 'crops_4'");
content = content.replace(/description:\s*'Õ’«œ «·»ÿ«ÿ« «·Õ·Ê… „‰ «·„“«—⁄ «·„’—Ì…'/, "descKey: 'crops_4'");

content = content.replace(/title:\s*'„“«—⁄ «·»’·'/, "titleKey: 'crops_5'");
content = content.replace(/description:\s*'Õ’«œ Ê Ã›Ì› «·»’· ﬁ»· «· ⁄»∆…'/, "descKey: 'crops_5'");

content = content.replace(/title:\s*'ÕﬁÊ· «·ÀÊ„'/, "titleKey: 'crops_6'");
content = content.replace(/description:\s*'Ì „ «Œ Ì«— √›÷· «·»’Ì·«  «·„ ﬂ«„·…'/, "descKey: 'crops_6'");

content = content.replace(/title:\s*'„Õ’Ê· «·›«’Ê·Ì«'/, "titleKey: 'crops_7'");
content = content.replace(/description:\s*'ﬁÿ«› «·›«’Ê·Ì« «·Œ÷—«¡ «·ÿ«“Ã…'/, "descKey: 'crops_7'");

content = content.replace(/title:\s*'«·Ã“— «·ÿ«“Ã'/, "titleKey: 'crops_8'");
content = content.replace(/description:\s*'Õ’«œ «·Ã“— Ê ﬁ·Ì„Â ›Ì «·ÕﬁÊ·'/, "descKey: 'crops_8'");

content = content.replace(/label:\s*'«·ﬂ·'/, "labelKey: 'all'");
content = content.replace(/label:\s*'„“«—⁄‰«'/, "labelKey: 'farms'");
content = content.replace(/label:\s*'«·›—“ Ê«· ⁄»∆…'/, "labelKey: 'sorting'");
content = content.replace(/label:\s*'«· ’œÌ—'/, "labelKey: 'export'");
content = content.replace(/label:\s*'«·„Õ«’Ì·'/, "labelKey: 'crops'");

content = content.replace(/title: string;/g, "titleKey: string;");
content = content.replace(/description\?: string;/g, "descKey?: string;");
content = content.replace(/label: string;/g, "labelKey: string;");

fs.writeFileSync(tsPath, content);
console.log('Done ts!');

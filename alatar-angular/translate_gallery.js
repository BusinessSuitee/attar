const fs = require('fs');
const path = require('path');

const tsPath = path.join(__dirname, 'src/app/pages/gallery/gallery.page.ts');
let content = fs.readFileSync(tsPath, 'utf8');

content = content.replace(/import { CommonModule, NgClass } from '@angular\/common';/, 
  "import { CommonModule, NgClass } from '@angular/common';\nimport { TranslocoModule } from '@jsverse/transloco';");
content = content.replace(/imports: \[CommonModule, NgClass\]/, 
  "imports: [CommonModule, NgClass, TranslocoModule]");

// replace titles to use transloco keys
content = content.replace(/title:\s*'����� �������� ������'/, "titleKey: 'crops_1'");
content = content.replace(/description:\s*'��� ������ ������ ������ ��� ���� �������� ��� ������ ������ �����'/, "descKey: 'crops_1'");

content = content.replace(/title:\s*'����� ���������'/, "titleKey: 'crops_2'");
content = content.replace(/description:\s*'����� ��������� �� ����� ����� ������'/, "descKey: 'crops_2'");

content = content.replace(/title:\s*'����� ������ �������'/, "titleKey: 'crops_3'");
content = content.replace(/description:\s*'������ ����� �� ���� ����� �����'/, "descKey: 'crops_3'");

content = content.replace(/title:\s*'����� �������'/, "titleKey: 'crops_4'");
content = content.replace(/description:\s*'���� ������� ������ �� ������� �������'/, "descKey: 'crops_4'");

content = content.replace(/title:\s*'���� �����'/, "titleKey: 'crops_6'");
content = content.replace(/description:\s*'��� ������ ���� �������� ���������'/, "descKey: 'crops_6'");

content = content.replace(/title:\s*'����� ���������'/, "titleKey: 'crops_7'");
content = content.replace(/description:\s*'���� ��������� ������� �������'/, "descKey: 'crops_7'");

content = content.replace(/title:\s*'����� ������'/, "titleKey: 'crops_8'");
content = content.replace(/description:\s*'���� ����� ������� �� ������'/, "descKey: 'crops_8'");

content = content.replace(/label:\s*'����'/, "labelKey: 'all'");
content = content.replace(/label:\s*'�������'/, "labelKey: 'farms'");
content = content.replace(/label:\s*'����� ��������'/, "labelKey: 'sorting'");
content = content.replace(/label:\s*'�������'/, "labelKey: 'export'");
content = content.replace(/label:\s*'��������'/, "labelKey: 'crops'");

content = content.replace(/title: string;/g, "titleKey: string;");
content = content.replace(/description\?: string;/g, "descKey?: string;");
content = content.replace(/label: string;/g, "labelKey: string;");

fs.writeFileSync(tsPath, content);
console.log('Done ts!');

const fs = require('fs');
let html = fs.readFileSync('D:/alatar/about.html', 'utf8');
let m = html.indexOf('<main');
let mEnd = html.indexOf('</main>') + 7;
let content = html.substring(m, mEnd);
content = content.replace('</main>', '      </ng-container>\\n    </main>');
let dict = {};
for(const k in dict){wrap=wrap.split(k).join(dict[k]);}
fs.writeFileSync('d:/alatar/alatar-angular/src/app/pages/about/about.page.html', wrap, 'utf8');

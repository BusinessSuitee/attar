const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'src/app/pages/gallery/gallery.page.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// Replace Hero Section
content = content.replace(
  />\s*ÃæáÇÏ ÇáÚØÇÑ\s*<\/span>/g,
  "> {{ 'gallery_page.hero.tag' | transloco }} </span>"
);
content = content.replace(
  />\s*ãÚÑÖ ÇáÕæÑ ÇáãÑÆí\s*<\/h1>/g,
  "> {{ 'gallery_page.hero.title' | transloco }} </h1>"
);
content = content.replace(
  />\s*ÊæËíŞ ÈÕÑí áÑÍáÉ ÃæáÇÏ ÇáÚØÇÑ İí ÇáÒÑÇÚÉ æÇáÊÕÏíÑ\.\. ÌæáÉ ÏÇÎá ãÒÇÑÚäÇ æãÍØÇÊ ÇáİÑÒ ÇáÍÏíËÉ\s*ÇáÊí ÊÖãä ÃÚáì ÏÑÌÇÊ ÇáÌæÏÉ\.\s*<\/p>/g,
  "> {{ 'gallery_page.hero.subtitle' | transloco }} </p>"
);

// Replace filter label
content = content.replace(
  /\{\{\s*filter\.label\s*\}\}/g,
  "{{ 'gallery_page.filters.' + filter.labelKey | transloco }}"
);

// Replace image title and description
content = content.replace(
  /\{\{\s*item\.title\s*\}\}/g,
  "{{ 'gallery_page.items.' + item.titleKey + '.title' | transloco }}"
);
content = content.replace(
  /\{\{\s*item\.description\s*\}\}/g,
  "{{ 'gallery_page.items.' + item.descKey + '.description' | transloco }}"
);

// Update item desc check
content = content.replace(
  /@if\s*\(\s*item\.description\s*\)/g,
  "@if (item.descKey)"
);

// Replace Not Found Section
content = content.replace(
  />áÇ ÊæÌÏ ÕæÑ İí åĞÇ ÇáŞÓã ÍÇáíÇğ<\/p>/g,
  ">{{ 'gallery_page.not_found.title' | transloco }}</p>"
);
content = content.replace(
  />\s*äŞæã ÈÊÍÏíË ÇáãÚÑÖ ÈÇÓÊãÑÇÑ¡ íãßäß ÊÕİÍ ÇáÃŞÓÇã ÇáÃÎÑì Ãæ ÇáÇØáÇÚ Úáì ÕæÑ ãÍÇÕíáäÇ\s*ÇáãÊæİÑÉ!\s*<\/p>/g,
  "> {{ 'gallery_page.not_found.desc' | transloco }} </p>"
);
content = content.replace(
  />\s*ÊÕİÍ ÕæÑ ÇáãÍÇÕíá\s*<\/button>/g,
  "> {{ 'gallery_page.not_found.btn' | transloco }} </button>"
);

// Replace label in the grid item
content = content.replace(
  />ÃæáÇÏ ÇáÚØÇÑ<\/span>/g,
  ">{{ 'gallery_page.hero.tag' | transloco }}</span>"
);

fs.writeFileSync(htmlPath, content);
console.log('Done html!');

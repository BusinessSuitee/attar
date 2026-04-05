const fs = require('fs');
const path = require('path');

const tsPath = path.join(__dirname, 'src/app/pages/gallery/gallery.page.ts');
let content = fs.readFileSync(tsPath, 'utf8');

const repl = 'readonly filterOptions: FilterOption[] = [\n' +
    '    { id: "all", labelKey: "all", icon: "collections" },\n' +
    '    { id: "farms", labelKey: "farms", icon: "landscape" },\n' +
    '    { id: "stations", labelKey: "sorting", icon: "precission_manufacturing" },\n' +
    '    { id: "crops", labelKey: "crops", icon: "agriculture" },\n' +
    '    { id: "legacy", labelKey: "legacy", icon: "workspace_premium" },\n' +
    '  ];\n\n' +
    '  readonly items: GalleryItem[] = [\n' +
    '    { id: 1, category: "crops", src: "assets/Images/2.jpeg", alt: "Orange", titleKey: "crops_1", descKey: "crops_1" },\n' +
    '    { id: 2, category: "crops", src: "assets/Images/1.jpeg", alt: "Grapes", titleKey: "crops_2", descKey: "crops_2" },\n' +
    '    { id: 3, category: "crops", src: "assets/Images/3.jpeg", alt: "Grapes", titleKey: "crops_3", descKey: "crops_3" },\n' +
    '    { id: 4, category: "crops", src: "assets/Images/4.jpeg", alt: "Mango", titleKey: "crops_4", descKey: "crops_4" },\n' +
    '    { id: 5, category: "crops", src: "assets/Images/7.jpeg", alt: "Strawberry", titleKey: "crops_5", descKey: "crops_5" },\n' +
    '    { id: 6, category: "crops", src: "assets/Images/8.jpeg", alt: "Onion", titleKey: "crops_6", descKey: "crops_6" },\n' +
    '  ];';

content = content.replace(/readonly filterOptions: FilterOption\[\] = \[[\s\S]*?readonly items: GalleryItem\[\] = \[[\s\S]*?\];/m, repl);

fs.writeFileSync(tsPath, content, 'utf8');
console.log('saved ts keys');

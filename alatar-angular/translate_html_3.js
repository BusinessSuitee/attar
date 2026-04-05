const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, 'public', 'assets', 'i18n', 'ar.json');
const enPath = path.join(__dirname, 'public', 'assets', 'i18n', 'en.json');
const ruPath = path.join(__dirname, 'public', 'assets', 'i18n', 'ru.json');

const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ruData = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// Common Footer translations
const footerAr = {
  about:
    'نصدر للعالم كنوز مصر الزراعية منذ عام 1975. الجودة، النزاهة، والاستدامة هي شعارنا في كل حصاد.',
  company: 'الشركة',
  about_group: 'عن المجموعة',
  our_story: 'قصتنا',
  sustainability: 'الاستدامة',
  careers: 'التوظيف',
  main_crops: 'محاصيلنا الرئيسية',
  citrus: 'الموالح',
  potatoes: 'البطاطس',
  onions: 'البصل',
  grapes: 'العنب',
  contact_us: 'تواصل معنا',
  address: 'طريق القاهرة الإسكندرية الصحراوي، مصر',
  copyright: '© 2026 مجموعة أولاد العطار. جميع الحقوق محفوظة.',
  privacy: 'سياسة الخصوصية',
  terms: 'الشروط والأحكام',
};

const footerEn = {
  about:
    "Exporting Egypt's agricultural treasures to the world since 1975. Quality, Integrity, and Sustainability are our mottos in every harvest.",
  company: 'The Company',
  about_group: 'About the Group',
  our_story: 'Our Story',
  sustainability: 'Sustainability',
  careers: 'Careers',
  main_crops: 'Main Crops',
  citrus: 'Citrus',
  potatoes: 'Potatoes',
  onions: 'Onions',
  grapes: 'Grapes',
  contact_us: 'Contact Us',
  address: 'Cairo-Alexandria Desert Road, Egypt',
  copyright: '© 2026 Alatar Group. All rights reserved.',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
};

const footerRu = {
  about:
    'Мы экспортируем сельскохозяйственные сокровища Египта в мир с 1975 года. Качество, честность и устойчивость — наши девизы в каждом урожае.',
  company: 'Компания',
  about_group: 'О Группе',
  our_story: 'Наша История',
  sustainability: 'Устойчивое развитие',
  careers: 'Карьера',
  main_crops: 'Основные Культуры',
  citrus: 'Цитрусовые',
  potatoes: 'Картофель',
  onions: 'Лук',
  grapes: 'Виноград',
  contact_us: 'Связаться с нами',
  address: 'Каирско-Александрийская пустынная дорога, Египет',
  copyright: '© 2026 Группа Alatar. Все права защищены.',
  privacy: 'Политика конфиденциальности',
  terms: 'Правила и условия',
};

arData.products_page.footer = footerAr;
enData.products_page.footer = footerEn;
ruData.products_page.footer = footerRu;

fs.writeFileSync(arPath, JSON.stringify(arData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(ruPath, JSON.stringify(ruData, null, 2));

let html = fs.readFileSync('src/app/pages/products/products.page.html', 'utf-8');

const reps = [
  [
    'نصدر للعالم كنوز مصر الزراعية منذ عام 1975. الجودة، النزاهة، والاستدامة هي شعارنا في كل حصاد.',
    "{{ 'products_page.footer.about' | transloco }}",
  ],
  ['الشركة', "{{ 'products_page.footer.company' | transloco }}"],
  ['عن المجموعة', "{{ 'products_page.footer.about_group' | transloco }}"],
  ['قصتنا', "{{ 'products_page.footer.our_story' | transloco }}"],
  ['الاستدامة', "{{ 'products_page.footer.sustainability' | transloco }}"],
  ['التوظيف', "{{ 'products_page.footer.careers' | transloco }}"],
  ['محاصيلنا الرئيسية', "{{ 'products_page.footer.main_crops' | transloco }}"],
  ['الموالح', "{{ 'products_page.footer.citrus' | transloco }}"],
  ['البطاطس', "{{ 'products_page.footer.potatoes' | transloco }}"],
  ['البصل', "{{ 'products_page.footer.onions' | transloco }}"],
  ['العنب', "{{ 'products_page.footer.grapes' | transloco }}"],
  ['تواصل معنا', "{{ 'products_page.footer.contact_us' | transloco }}"],
  ['طريق القاهرة الإسكندرية الصحراوي، مصر', "{{ 'products_page.footer.address' | transloco }}"],
  [
    '© 2026 مجموعة أولاد العطار. جميع الحقوق محفوظة.',
    "{{ 'products_page.footer.copyright' | transloco }}",
  ],
  ['سياسة الخصوصية', "{{ 'products_page.footer.privacy' | transloco }}"],
  ['الشروط والأحكام', "{{ 'products_page.footer.terms' | transloco }}"],
  // Clean up some left over empty spans etc inside transloco
];

reps.forEach(([oldStr, newStr]) => {
  html = html.split(oldStr).join(newStr);
});

// Fix html direction missing dir wrapper
fs.writeFileSync('src/app/pages/products/products.page.html', html);
console.log('Footer translated!');

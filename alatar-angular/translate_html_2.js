const fs = require('fs');

const path = require('path');

const arPath = path.join(__dirname, 'public', 'assets', 'i18n', 'ar.json');
const enPath = path.join(__dirname, 'public', 'assets', 'i18n', 'en.json');
const ruPath = path.join(__dirname, 'public', 'assets', 'i18n', 'ru.json');

const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ruData = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// Add the missing keys
const extraKeysEn = {
  whatsapp_btn: 'Order via WhatsApp',
  quality_badge: { title: 'Quality', desc: 'First Class Export' },
  delivery_badge: { title: 'Delivery', desc: 'Logistics & Expertise' },
};

const extraKeysRu = {
  whatsapp_btn: 'Заказать через WhatsApp',
  quality_badge: { title: 'Качество', desc: 'Экспорт Первого Класса' },
  delivery_badge: { title: 'Доставка', desc: 'Логистика и Опыт' },
};

const extraKeysAr = {
  whatsapp_btn: 'طلب عبر واتساب',
  quality_badge: { title: 'الجودة', desc: 'تصدير درجة أولى' },
  delivery_badge: { title: 'التوصيل', desc: 'لوجستيات وخبرة' },
};

Object.assign(arData.products_page, extraKeysAr);
Object.assign(enData.products_page, extraKeysEn);
Object.assign(ruData.products_page, extraKeysRu);

fs.writeFileSync(arPath, JSON.stringify(arData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(ruPath, JSON.stringify(ruData, null, 2));

// HTML modifications
let html = fs.readFileSync('src/app/pages/products/products.page.html', 'utf-8');

const replacements = [
  ['الجودة', "{{ 'products_page.quality_badge.title' | transloco }}"],
  ['تصدير درجة أولى', "{{ 'products_page.quality_badge.desc' | transloco }}"],
  ['التوصيل', "{{ 'products_page.delivery_badge.title' | transloco }}"],
  ['لوجستيات وخبرة', "{{ 'products_page.delivery_badge.desc' | transloco }}"],
  ['طلب عبر واتساب', "{{ 'products_page.whatsapp_btn' | transloco }}"],
];

replacements.forEach(([oldStr, newStr]) => {
  html = html.split(oldStr).join(newStr);
});

// Since footer is generic, I'll let it be for now, or quickly translate the common footer which is already translatable or left as is.
fs.writeFileSync('src/app/pages/products/products.page.html', html);
console.log('HTML Translated successfully part 2!');

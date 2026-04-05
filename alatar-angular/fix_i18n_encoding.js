const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, 'public', 'assets', 'i18n', 'ar.json');
const enPath = path.join(__dirname, 'public', 'assets', 'i18n', 'en.json');
const ruPath = path.join(__dirname, 'public', 'assets', 'i18n', 'ru.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf-8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));

ar.gallery_page = {
  hero: {
    tag: 'أولاد العطار',
    title: 'معرض الصور المرئي',
    subtitle: 'توثيق بصري لرحلة أولاد العطار في الزراعة والتصدير.. جولة داخل مزارعنا ومحطات الفرز الحديثة التي تضمن أعلى درجات الجودة.'
  },
  filters: {
    all: 'الكل',
    farms: 'المزارع والأراضي',
    sorting: 'المحطات والإنتاج',
    export: 'التصدير',
    crops: 'المحاصيل',
    legacy: 'إرث المؤسس'
  },
  items: {
    crops_1: { title: 'البرتقال المصري للاستهلاك الطازج', description: 'محصول شتوي متميز للتصدير.' },
    crops_2: { title: 'عنب أبيض بدون بذور', description: 'محصول صيفي طازج.' },
    crops_3: { title: 'عنب أسود فاخر', description: 'محصول صيفي للتصدير المبكر.' },
    crops_4: { title: 'مانجو مصرية', description: 'ثمرات منتقاة وعالية المذاق.' },
    crops_5: { title: 'فراولة طازجة', description: 'محصول التصدير الأول شتوياً.' },
    crops_6: { title: 'بصل أحمر', description: 'صلابة وقدرة تخزينية ممتازة.' }
  },
  not_found: {
    title: 'لا توجد صور في هذا القسم حالياً',
    desc: 'نقوم بتحديث المعرض باستمرار، يمكنك تصفح الأقسام الأخرى أو الاطلاع على صور محاصيلنا المتوفرة!',
    btn: 'تصفح صور المحاصيل'
  }
};

en.gallery_page = {
  hero: {
    tag: 'Alatar Sons',
    title: 'Visual Gallery',
    subtitle: 'A visual documentation of Alatar Sons\' journey in agriculture and export. A tour inside our farms and modern sorting stations ensuring the highest quality.'
  },
  filters: {
    all: 'All',
    farms: 'Farms & Lands',
    sorting: 'Stations & Production',
    export: 'Export',
    crops: 'Crops',
    legacy: 'Founder\'s Legacy'
  },
  items: {
    crops_1: { title: 'Egyptian Oranges for Fresh Consumption', description: 'Premium winter crop for export.' },
    crops_2: { title: 'Seedless White Grapes', description: 'Fresh summer crop.' },
    crops_3: { title: 'Premium Black Grapes', description: 'Summer crop for early export.' },
    crops_4: { title: 'Egyptian Mangoes', description: 'Hand-picked fruits with high flavor.' },
    crops_5: { title: 'Fresh Strawberries', description: 'The top winter export crop.' },
    crops_6: { title: 'Red Onions', description: 'Excellent firmness and storage capacity.' }
  },
  not_found: {
    title: 'No images currently in this section',
    desc: 'We are continuously updating the gallery. You can browse other sections or check our available crops.',
    btn: 'Browse Crops'
  }
};

ru.gallery_page = {
  hero: {
    tag: 'Сыновья Алатара',
    title: 'Визуальная галерея',
    subtitle: 'Визуальное документирование пути Сыновей Алатара в сельском хозяйстве и экспорте. Экскурсия по нашим фермам и современным сортировочным станциям, обеспечивающим высочайшее качество.'
  },
  filters: {
    all: 'Все',
    farms: 'Фермы и земли',
    sorting: 'Станции и производство',
    export: 'Экспорт',
    crops: 'Урожай',
    legacy: 'Наследие основателя'
  },
  items: {
    crops_1: { title: 'Египетские апельсины для свежего потребления', description: 'Премиальный зимний урожай для экспорта.' },
    crops_2: { title: 'Белый виноград без косточек', description: 'Свежий летний урожай.' },
    crops_3: { title: 'Премиальный черный виноград', description: 'Летний урожай для раннего экспорта.' },
    crops_4: { title: 'Египетское манго', description: 'Отборные плоды с отличным вкусом.' },
    crops_5: { title: 'Свежая клубника', description: 'Главный зимний экспортный урожай.' },
    crops_6: { title: 'Красный лук', description: 'Отличная твердость и срок хранения.' }
  },
  not_found: {
    title: 'В этом разделе пока нет изображений',
    desc: 'Мы постоянно обновляем галерею. Вы можете просмотреть другие разделы или нашу доступную продукцию.',
    btn: 'Просмотреть урожай'
  }
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf-8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf-8');
fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2), 'utf-8');
console.log('JSON files fixed!');

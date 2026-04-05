const fs = require('fs');

let html = fs.readFileSync('src/app/pages/products/products.page.html', 'utf-8');

const replacements = [
  ['dir="rtl"', ''],
  ['موسم 2024-2025', "{{ 'products_page.hero.badge' | transloco }}"],
  ['محاصيلنا: من قلب مزارعنا إلى العالم', "{{ 'products_page.hero.title' | transloco }}"],
  [
    'نقدم تشكيلة متنوعة من أجود المحاصيل المصرية، مزروعة بعناية ومجهزة وفقا لأعلى معايير التصدير العالمية.',
    "{{ 'products_page.hero.desc' | transloco }}",
  ],
  ['فخر الزراعة المصرية', "{{ 'products_page.featured.badge' | transloco }}"],
  ['الموالح والبرتقال المصري', "{{ 'products_page.featured.title' | transloco }}"],
  [
    'تعد شركة أولاد العطار من الرواد في تصدير الموالح المصرية، حيث نمتلك مزارع شاسعة تنتج أفخر أنواع البرتقال المطلوب عالميا بفضل المناخ المثالي والتربة الخصبة، مع مراعاة أدق تفاصيل الجودة من الغرس حتى التعبئة.',
    "{{ 'products_page.featured.desc' | transloco }}",
  ],
  ['الأصناف المتوفرة', "{{ 'products_page.featured.varieties' | transloco }}"],
  ['برتقال أبو سرة (Navel)', "{{ 'products_page.featured.var_navel' | transloco }}"],
  ['فالنسيا (Valencia)', "{{ 'products_page.featured.var_valencia' | transloco }}"],
  ['بلدي (Baladi)', "{{ 'products_page.featured.var_baladi' | transloco }}"],
  ['مواسم التوريد', "{{ 'products_page.featured.seasons' | transloco }}"],
  [
    '<span class="material-symbols-outlined text-accent">category</span>',
    '<span class="material-symbols-outlined text-accent">category</span>',
  ], // just to anchor
  ['<span>نوفمبر</span>', "<span>{{ 'products_page.featured.month_start' | transloco }}</span>"],
  ['<span>مايو</span>', "<span>{{ 'products_page.featured.month_end' | transloco }}</span>"],
  ['متاح طوال موسم الشتاء والربيع', "{{ 'products_page.featured.season_desc' | transloco }}"],
  ['مطابق للمواصفات الأوروبية', "{{ 'products_page.featured.feature1' | transloco }}"],
  ['تعبئة آلية معقمة', "{{ 'products_page.featured.feature2' | transloco }}"],
  ['شحن مبرد', "{{ 'products_page.featured.feature3' | transloco }}"],
  ['طلب عرض أسعار للبرتقال', "{{ 'products_page.featured.btn_quote' | transloco }}"],
  ['المنتج الأكثر تصديرا', "{{ 'products_page.featured.overlay_badge' | transloco }}"],
  ['تنوع لا يضاهى', "{{ 'products_page.list.badge' | transloco }}"],
  ['قائمة المحاصيل الموسمية', "{{ 'products_page.list.title' | transloco }}"],
  [
    'لا توجد محاصيل متاحة في هذا التصنيف حالياً',
    "{{ 'products_page.list.empty_title' | transloco }}",
  ],
  [
    'جرّب تصنيفًا آخر أو تواصل مع فريق المبيعات للتوفر القادم.',
    "{{ 'products_page.list.empty_desc' | transloco }}",
  ],
  ['طلب تسعير', "{{ 'products_page.list.btn_quote' | transloco }}"],
  ['ضمان الجودة وسلامة الغذاء', "{{ 'products_page.quality.title' | transloco }}"],
  [
    'نلتزم بأعلى معايير سلامة الغذاء العالمية لضمان وصول منتجاتنا صحية وآمنة للمستهلك. جميع محطاتنا ومزارعنا تخضع لرقابة صارمة ومطبقة لأحدث البروتوكولات الزراعية.',
    "{{ 'products_page.quality.desc' | transloco }}",
  ],
  ['الممارسات الزراعية', "{{ 'products_page.quality.cert1' | transloco }}"],
  ['سلامة الغذاء', "{{ 'products_page.quality.cert2' | transloco }}"],
  ['إدارة الجودة', "{{ 'products_page.quality.cert3' | transloco }}"],
  ['جاهز لطلب محصولك؟', "{{ 'products_page.cta.title' | transloco }}"],
  [
    'فريق المبيعات لدينا جاهز لمساعدتك في تأمين أفضل المحاصيل بالمواصفات والكميات التي تحتاجها لأسواقك.',
    "{{ 'products_page.cta.desc' | transloco }}",
  ],
  ['احجز طلبية الآن', "{{ 'products_page.cta.btn' | transloco }}"],
  ['{{ filter.label }}', '{{ filter.labelKey | transloco }}'],
  ['{{ product.title }}', '{{ product.titleKey | transloco }}'],
  ['[alt]="product.title"', '[alt]="product.titleKey | transloco"'],
  ['{{ product.season }}', '{{ product.seasonKey | transloco }}'],
  ['{{ product.description }}', '{{ product.descriptionKey | transloco }}'],
  ['{{ product.badge }}', "{{ 'products_page.filters.' + product.badgeType | transloco }}"],
  ['<!-- Replace old bindings with key bindings -->', ''],
];

replacements.forEach(([oldStr, newStr]) => {
  if (html.includes(oldStr) && oldStr !== '') {
    // some might appear multiple times
    html = html.split(oldStr).join(newStr);
  }
});

fs.writeFileSync('src/app/pages/products/products.page.html', html);
console.log('HTML Translated successfully!');

(() => {
  const STORAGE_KEY = "awlad_elattar_lang";
  const SUPPORTED = ["AR", "EN", "RU"];
  const HTML_LANG = { AR: "ar", EN: "en", RU: "ru" };
  const HTML_DIR = { AR: "rtl", EN: "ltr", RU: "ltr" };

  const DICTIONARY = {
    "الصفحة الرئيسية: إرث الحاج عبادة العطار وثقة الأجيال": { EN: "Home: Legacy of Al-Hajj Ebada El-Attar and Generations of Trust", RU: "Главная: наследие хаджи Эбады Эль-Аттара и доверие поколений" },
    "أولاد العطار - من نحن": { EN: "Awlad El Attar - About Us", RU: "Awlad El Attar - О нас" },
    "المحطات والأراضي | أولاد العطار": { EN: "Stations & Farms | Awlad El Attar", RU: "Станции и земли | Awlad El Attar" },
    "أولاد العطار - تواصل معنا": { EN: "Awlad El Attar - Contact Us", RU: "Awlad El Attar - Свяжитесь с нами" },
    "أولاد العطار - معرض الصور والفيديو": { EN: "Awlad El Attar - Photo & Video Gallery", RU: "Awlad El Attar - Фото и видео галерея" },
    "المحاصيل: قائمة المنتجات الزراعية ومواسم التوريد": { EN: "Crops: Product List and Supply Seasons", RU: "Культуры: список продукции и сезоны поставок" },
    "أولاد العطار - شركاؤنا وصادراتنا": { EN: "Awlad El Attar - Partners & Exports", RU: "Awlad El Attar - Партнеры и экспорт" },

    "تأسست 1975": { EN: "Established 1975", RU: "Основана в 1975" },
    "الرئيسية": { EN: "Home", RU: "Главная" },
    "من نحن": { EN: "About Us", RU: "О нас" },
    "شركاؤنا": { EN: "Our Partners", RU: "Партнеры" },
    "المحاصيل": { EN: "Crops", RU: "Культуры" },
    "المحطات": { EN: "Stations", RU: "Станции" },
    "المحطات والأراضي": { EN: "Stations & Farms", RU: "Станции и земли" },
    "المعرض": { EN: "Gallery", RU: "Галерея" },
    "اتصل بنا": { EN: "Contact", RU: "Контакты" },
    "تواصل معنا": { EN: "Contact Us", RU: "Связаться с нами" },
    "اطلب عرض سعر": { EN: "Request a Quote", RU: "Запросить цену" },
    "احجز محصولك": { EN: "Reserve Your Crop", RU: "Забронировать урожай" },
    "احجز محصولك الآن": { EN: "Reserve Your Crop Now", RU: "Забронировать урожай сейчас" },
    "منتجاتنا": { EN: "Our Products", RU: "Наша продукция" },
    "عرض كل المنتجات": { EN: "View All Products", RU: "Все продукты" },
    "أولاد العطار": { EN: "Awlad El Attar", RU: "Авлад Эль-Аттар" },
    "منذ 1975": { EN: "Since 1975", RU: "С 1975 года" },
    "50 عاماً من الثقة في توريد وتصدير أجود المحاصيل المصرية": {
      EN: "50 years of trust in supplying and exporting the finest Egyptian crops",
      RU: "50 лет доверия в поставках и экспорте лучших египетских культур",
    },
    "نربط خيرات أرض مصر بالعالم، من مزارعنا في الطريق الصحراوي إلى أكبر الأسواق العالمية والمحلية.": {
      EN: "We connect the bounty of Egypt's land to the world, from our farms on the desert road to the largest global and local markets.",
      RU: "Мы соединяем дары египетской земли с миром: от наших ферм на пустынной дороге до крупнейших мировых и местных рынков.",
    },
    "مركز تصدير عالمي": { EN: "Global export hub", RU: "Глобальный экспортный центр" },
    "+50,000 طن سنوياً": { EN: "+50,000 tons annually", RU: "+50 000 тонн в год" },
    "تاريخ عريق منذ 1975": { EN: "Rich heritage since 1975", RU: "Богатая история с 1975 года" },
    "شهادات جودة عالمية": { EN: "Global quality certifications", RU: "Международные сертификаты качества" },
    "الحاج عبادة العطار": { EN: "Al-Hajj Ebada El Attar", RU: "Хаджи Эбада Эль-Аттар" },
    "مؤسس المجموعة": { EN: "Group Founder", RU: "Основатель группы" },
    "إرث من الثقة": { EN: "A legacy of trust", RU: "Наследие доверия" },
    "الحاج عبد الفتاح يوسف عبد الغني العطار": {
      EN: "Al-Hajj Abdel Fattah Youssef Abdel Ghani El Attar",
      RU: "Хаджи Абдель Фаттах Юсеф Абдель Гани Эль-Аттар",
    },
    "\"تجارة قامت على الأخلاق وحفظ العهد.. من مزارعنا للعالم بكل أمانة\"": {
      EN: "\"A business built on ethics and honoring commitments... from our farms to the world with full integrity.\"",
      RU: "\"Дело, построенное на нравственности и верности слову... от наших ферм к миру с полной честностью.\"",
    },
    "نشأ الحاج عبادة في رحاب القرآن الكريم والأخلاق الأصيلة، فكانت تلك القيم هي الأساس الذي بنيت عليه إمبراطورية \"أولاد العطار\". لم يكن مجرد تاجر، بل كان مرجعاً في المشورة، وسيطاً للخير، ورائداً وضع اللبنة الأولى للزراعة التصديرية الحديثة في مصر.": {
      EN: "Al-Hajj Ebada grew up in the spirit of the Holy Qur'an and authentic values. These principles became the foundation on which the Awlad El Attar empire was built. He was not just a trader, but a trusted advisor, a force for good, and a pioneer who laid the first stone of modern export agriculture in Egypt.",
      RU: "Хаджи Эбада вырос в атмосфере Корана и подлинных нравственных ценностей. Именно они стали фундаментом, на котором была построена империя Awlad El Attar. Он был не просто торговцем, а авторитетным советником, посредником добра и пионером, заложившим основу современной экспортной аграрной отрасли в Египте.",
    },
    "ما بدأ كشغف بالأرض تحول بفضل رؤيته وحكمته إلى مؤسسة عريقة تمتد جذورها لأكثر من نصف قرن، محافظة على العهد ومورثة للأمانة جيلاً بعد جيل.": {
      EN: "What began as a passion for the land evolved, through his vision and wisdom, into a long-standing institution with roots stretching back more than half a century, preserving commitments and passing integrity from one generation to the next.",
      RU: "То, что началось как любовь к земле, благодаря его видению и мудрости превратилось в солидную компанию с корнями более чем в полвека, сохраняющую верность слову и передающую честность из поколения в поколение.",
    },
    "ركائز النجاح": { EN: "Pillars of success", RU: "Основы успеха" },
    "أمانة العهد": { EN: "Honoring commitments", RU: "Верность обязательствам" },
    "أخلاق القرآن": { EN: "Qur'anic ethics", RU: "Нравственность Корана" },
    "حكمة المشورة": { EN: "Wisdom in counsel", RU: "Мудрость в совете" },
    "قوة التوريد والتصدير": { EN: "Supply and export strength", RU: "Сила поставок и экспорта" },
    "شراكات استراتيجية عملاقة": { EN: "Major strategic partnerships", RU: "Крупные стратегические партнерства" },
    "نحن الجسر الذي يربط بين وفرة الإنتاج المحلي ومعايير التصدير العالمية، بحجم تعاملات يتجاوز 50,000 طن سنوياً.": {
      EN: "We are the bridge connecting abundant local production with global export standards, with annual volumes exceeding 50,000 tons.",
      RU: "Мы — мост между обильным местным производством и мировыми экспортными стандартами, с объемом операций более 50 000 тонн в год.",
    },
    "عملاق التوريد المحلي": { EN: "Local supply powerhouse", RU: "Лидер локальных поставок" },
    "الشريك الموثوق للمصانع الكبرى": { EN: "Trusted partner for major factories", RU: "Надежный партнер для крупных предприятий" },
    "نفتخر بكوننا المورد الرئيسي لكبرى الشركات الزراعية والصناعية في مصر، حيث نضمن تدفقاً مستمراً من المحاصيل بأعلى جودة.": {
      EN: "We are proud to be the main supplier for leading agricultural and industrial companies in Egypt, ensuring a continuous flow of crops at the highest quality.",
      RU: "Мы гордимся тем, что являемся основным поставщиком крупнейших аграрных и промышленных компаний Египта, обеспечивая стабильный поток продукции высшего качества.",
    },
    "شركاء النجاح": { EN: "Success partners", RU: "Партнеры успеха" },
    "الوادي (Al-Wadi)": { EN: "Al-Wadi", RU: "Аль-Вади" },
    "نهضة مصر (Nahdet Misr)": { EN: "Nahdet Misr", RU: "Нахдет Миср" },
    "بيكو (Pico)": { EN: "Pico", RU: "Пико" },
    "مغربي (Maghrabi)": { EN: "Maghrabi", RU: "Маграби" },
    "بوابة التصدير العالمية": { EN: "Global export gateway", RU: "Глобальные ворота экспорта" },
    "بنية تحتية متكاملة تضمن وصول منتجاتنا طازجة إلى الأسواق الأوروبية والآسيوية، مدعومة بمحطات تعبئة بمعايير عالمية.": {
      EN: "An integrated infrastructure ensures our products reach European and Asian markets fresh, supported by packing stations that meet global standards.",
      RU: "Комплексная инфраструктура обеспечивает поставку нашей продукции в свежем виде на европейские и азиатские рынки при поддержке упаковочных станций мирового уровня.",
    },
    "رموز الثقة والجودة": { EN: "Symbols of trust and quality", RU: "Символы доверия и качества" },
    "محطة العطار (Al-Attar Station)": { EN: "Al-Attar Station", RU: "Станция Аль-Аттар" },
    "محطة MHA": { EN: "MHA Station", RU: "Станция MHA" },
    "فخر إنتاجنا": { EN: "Pride of our production", RU: "Гордость нашего производства" },
    "أجود محاصيل مصر": { EN: "Egypt's finest crops", RU: "Лучшие культуры Египта" },
    "جودة منذ 1975": { EN: "Quality since 1975", RU: "Качество с 1975 года" },
    "الموالح والبرتقال": { EN: "Citrus and oranges", RU: "Цитрусовые и апельсины" },
    "البرتقال المصري الشهير عالمياً بجودته ومذاقه. ننتقي أفضل الثمار من مزارعنا لتصلكم طازجة.": {
      EN: "Egyptian oranges are globally renowned for their quality and flavor. We select the best fruits from our farms so they reach you fresh.",
      RU: "Египетские апельсины всемирно известны своим качеством и вкусом. Мы отбираем лучшие плоды с наших ферм, чтобы они доставлялись к вам свежими.",
    },
    "نوفمبر - مايو": { EN: "November - May", RU: "Ноябрь - Май" },
    "تعبئة فاخرة": { EN: "Premium packaging", RU: "Премиальная упаковка" },
    "العنب الفاخر": { EN: "Premium grapes", RU: "Премиальный виноград" },
    "عناقيد العنب المختارة بعناية فائقة. مواصفات تصديرية تلبي أذواق الأسواق الأوروبية.": {
      EN: "Carefully selected grape clusters with export specifications tailored to European market preferences.",
      RU: "Тщательно отобранные грозди винограда с экспортными характеристиками, соответствующими требованиям европейских рынков.",
    },
    "مايو - أغسطس": { EN: "May - August", RU: "Май - Август" },
    "عبوات متنوعة": { EN: "Various packaging options", RU: "Различные варианты упаковки" },
    "سواء كنت تبحث عن كميات ضخمة للسوق المحلي أو جودة تصديرية عالمية، أولاد العطار تضمن لك الالتزام والجودة في كل شحنة.": {
      EN: "Whether you need large volumes for the local market or world-class export quality, Awlad El Attar guarantees commitment and quality in every shipment.",
      RU: "Нужны ли вам крупные объемы для местного рынка или экспортное качество мирового уровня, Awlad El Attar гарантирует обязательность и качество в каждой поставке.",
    },
    "نصدر للعالم كنوز مصر الزراعية منذ عام 1975. الجودة، النزاهة، والاستدامة هي شعارنا في كل حصاد.": {
      EN: "We have been exporting Egypt's agricultural treasures to the world since 1975. Quality, integrity, and sustainability are our motto in every harvest.",
      RU: "С 1975 года мы экспортируем сельскохозяйственные богатства Египта всему миру. Качество, честность и устойчивость — наш принцип в каждом урожае.",
    },
    "الموالح": { EN: "Citrus", RU: "Цитрусовые" },
    "البطاطس": { EN: "Potatoes", RU: "Картофель" },
    "البصل": { EN: "Onions", RU: "Лук" },
    "العنب": { EN: "Grapes", RU: "Виноград" },
    "طريق القاهرة الإسكندرية الصحراوي، مصر": { EN: "Cairo-Alexandria Desert Road, Egypt", RU: "Дорога Каир-Александрия, Египет" },
    "© 2026 مجموعة أولاد العطار. جميع الحقوق محفوظة.": {
      EN: "© 2026 Awlad El Attar Group. All rights reserved.",
      RU: "© 2026 Группа Awlad El Attar. Все права защищены.",
    },
    "الانتقال للأسفل": { EN: "Scroll down", RU: "Прокрутить вниз" },

    "طلب تسعير": { EN: "Request Pricing", RU: "Запросить цену" },
    "طلب عرض أسعار للبرتقال": { EN: "Request Orange Quote", RU: "Запросить цену на апельсины" },
    "طلب عرض سعر": { EN: "Request a Quote", RU: "Запросить цену" },
    "ابدأ الطلب": { EN: "Start Order", RU: "Начать заказ" },
    "تواصل مع المبيعات": { EN: "Contact Sales", RU: "Связаться с отделом продаж" },
    "تواصل معنا الآن": { EN: "Contact Us Now", RU: "Свяжитесь с нами сейчас" },
    "تصفح منتجاتنا": { EN: "Browse Products", RU: "Смотреть продукцию" },
    "اكتشف المزيد": { EN: "Discover More", RU: "Узнать больше" },
    "مشاهدة الفيديو التعريفي": { EN: "Watch Intro Video", RU: "Смотреть презентацию" },
    "شاهد الفيديو": { EN: "Watch Video", RU: "Смотреть видео" },
    "تحميل كتالوج الشركة": { EN: "Download Company Catalog", RU: "Скачать каталог компании" },
    "تحميل ملف الشركة": { EN: "Download Company Profile", RU: "Скачать профиль компании" },
    "تحميل": { EN: "Download", RU: "Скачать" },

    "هل تبحث عن شريك زراعي موثوق؟": { EN: "Looking for a Trusted Agricultural Partner?", RU: "Ищете надежного агропартнера?" },
    "نرحب بزيارتكم في أي وقت": { EN: "You Are Welcome to Visit Anytime", RU: "Добро пожаловать в любое время" },
    "تفضل بزيارة محطاتنا": { EN: "Visit Our Stations", RU: "Посетить наши станции" },
    "تابعنا على إنستجرام": { EN: "Follow Us on Instagram", RU: "Подписаться в Instagram" },
    "قناتنا على يوتيوب": { EN: "Our YouTube Channel", RU: "Наш канал YouTube" },
    "كل الفيديوهات": { EN: "All Videos", RU: "Все видео" },
    "عرض كل الصور": { EN: "View All Photos", RU: "Все фото" },
    "عرض المزيد من الصور": { EN: "Show More Photos", RU: "Показать больше фото" },
    "مكتبة المعرفة": { EN: "Knowledge Library", RU: "Библиотека знаний" },
    "مقالات ونصائح من أرض الخبرة": { EN: "Articles and insights from real field experience", RU: "Статьи и советы из практического опыта" },
    "محتوى عملي يشارك خبرتنا في الزراعة والتعبئة والتصدير، لمساعدة شركائنا على اتخاذ قرارات أفضل طوال الموسم.": {
      EN: "Practical content that shares our experience in farming, packing, and export to help our partners make better decisions throughout the season.",
      RU: "Практический контент с нашим опытом в выращивании, упаковке и экспорте, который помогает партнерам принимать лучшие решения в течение всего сезона.",
    },
    "سلسلة الجودة": { EN: "Quality Series", RU: "Серия о качестве" },
    "12 يناير 2026": { EN: "12 January 2026", RU: "12 января 2026" },
    "كيف نضمن جودة البرتقال من الحصاد حتى التصدير؟": {
      EN: "How do we ensure orange quality from harvest to export?",
      RU: "Как мы обеспечиваем качество апельсинов от сбора до экспорта?",
    },
    "خطوات الفحص والفرز والتبريد التي نعتمدها لضمان وصول الموالح المصرية بنفس الطزاجة والجودة إلى العميل النهائي.": {
      EN: "The inspection, sorting, and cooling steps we follow to ensure Egyptian citrus reaches the end customer with the same freshness and quality.",
      RU: "Этапы проверки, сортировки и охлаждения, которые мы применяем, чтобы египетские цитрусовые доходили до клиента с той же свежестью и качеством.",
    },
    "اقرأ المقال": { EN: "Read Article", RU: "Читать статью" },
    "نصائح زراعية": { EN: "Agricultural Tips", RU: "Агрономические советы" },
    "05 يناير 2026": { EN: "05 January 2026", RU: "05 января 2026" },
    "5 مؤشرات لاختيار توقيت الحصاد المثالي للعنب": {
      EN: "5 indicators to choose the ideal grape harvest timing",
      RU: "5 показателей для выбора идеального времени сбора винограда",
    },
    "دليلك السريع لفهم مؤشرات اللون والصلابة ونسبة السكر، لتحديد أفضل توقيت يحافظ على مواصفات التصدير.": {
      EN: "A quick guide to understanding color, firmness, and sugar indicators to choose the best timing while preserving export specifications.",
      RU: "Краткое руководство по цвету, плотности и уровню сахара для выбора лучшего времени сбора с сохранением экспортных требований.",
    },
    "أسواق عالمية": { EN: "Global Markets", RU: "Мировые рынки" },
    "28 ديسمبر 2025": { EN: "28 December 2025", RU: "28 декабря 2025" },
    "ماذا تتطلب الأسواق الأوروبية في تعبئة وتغليف المحاصيل؟": {
      EN: "What do European markets require in crop packing and packaging?",
      RU: "Что требуют европейские рынки от упаковки сельхозпродукции?",
    },
    "نظرة على الاشتراطات العملية الخاصة بالعبوات والبيانات وجودة التجهيز، لتقليل الرفض وزيادة الاعتمادية.": {
      EN: "A look at practical requirements for packaging, labeling, and preparation quality to reduce rejection and improve reliability.",
      RU: "Обзор практических требований к таре, маркировке и качеству подготовки для снижения отказов и повышения надежности.",
    },
    "عرض كل المقالات": { EN: "View All Articles", RU: "Смотреть все статьи" },
    "مراقبة جودة البرتقال في المزرعة": { EN: "Orange quality monitoring on the farm", RU: "Контроль качества апельсинов на ферме" },
    "توقيت حصاد العنب في المزارع": { EN: "Grape harvest timing in farms", RU: "Сроки сбора винограда на фермах" },
    "معايير التعبئة والتغليف للتصدير": { EN: "Export packing and packaging standards", RU: "Стандарты экспортной упаковки" },

    "شركة": { EN: "Company", RU: "Компания" },
    "الشركة": { EN: "Company", RU: "Компания" },
    "المنتجات": { EN: "Products", RU: "Продукция" },
    "روابط سريعة": { EN: "Quick Links", RU: "Быстрые ссылки" },
    "الدعم": { EN: "Support", RU: "Поддержка" },
    "الدعم والمساعدة": { EN: "Support & Help", RU: "Поддержка и помощь" },
    "النشرة البريدية": { EN: "Newsletter", RU: "Рассылка" },
    "اشترك": { EN: "Subscribe", RU: "Подписаться" },
    "اشتراك": { EN: "Subscribe", RU: "Подписка" },
    "سياسة الخصوصية": { EN: "Privacy Policy", RU: "Политика конфиденциальности" },
    "الشروط والأحكام": { EN: "Terms & Conditions", RU: "Условия использования" },
    "عن الشركة": { EN: "About Company", RU: "О компании" },
    "عن المجموعة": { EN: "About Group", RU: "О группе" },
    "قصتنا": { EN: "Our Story", RU: "Наша история" },
    "الاستدامة": { EN: "Sustainability", RU: "Устойчивое развитие" },
    "التوظيف": { EN: "Careers", RU: "Карьера" },
    "الوظائف": { EN: "Careers", RU: "Вакансии" },
    "معرض الصور": { EN: "Photo Gallery", RU: "Фотогалерея" },
    "خدمة العملاء": { EN: "Customer Service", RU: "Служба поддержки" },
    "الأسئلة الشائعة": { EN: "FAQ", RU: "Частые вопросы" },
    "أخبارنا": { EN: "Our News", RU: "Наши новости" },
    "الأخبار والفعاليات": { EN: "News & Events", RU: "Новости и события" },

    "قصة نجاح مصرية": { EN: "An Egyptian Success Story", RU: "Египетская история успеха" },
    "إرث من الثقة..": { EN: "A Legacy of Trust..", RU: "Наследие доверия.." },
    "قصة بدأت منذ 1975": { EN: "A Story That Started in 1975", RU: "История, начавшаяся в 1975" },
    "قصة المؤسس": { EN: "Founder Story", RU: "История основателя" },
    "مسيرة النجاح عبر الزمن": { EN: "Journey of Success Through Time", RU: "Путь успеха сквозь время" },
    "رؤيتنا وقيمنا": { EN: "Our Vision & Values", RU: "Наше видение и ценности" },

    "رحلة الجودة": { EN: "Journey of Quality", RU: "Путь качества" },
    "من المزرعة إلى العالم": { EN: "From Farm to the World", RU: "От фермы к миру" },
    "جولة داخل محطاتنا": { EN: "Tour Inside Our Stations", RU: "Экскурсия по нашим станциям" },

    "محطاتنا وأراضينا: منبع الجودة والاحترافية": { EN: "Our Stations & Lands: Source of Quality and Professionalism", RU: "Наши станции и земли: источник качества и профессионализма" },
    "خريطة الصادرات العالمية": { EN: "Global Export Map", RU: "Карта мирового экспорта" },
    "الشركاء الاستراتيجيون": { EN: "Strategic Partners", RU: "Стратегические партнеры" },

    "معلومات التواصل": { EN: "Contact Information", RU: "Контактная информация" },
    "الهاتف والواتساب": { EN: "Phone & WhatsApp", RU: "Телефон и WhatsApp" },
    "البريد الإلكتروني": { EN: "Email", RU: "Эл. почта" },
    "المقر الرئيسي": { EN: "Head Office", RU: "Главный офис" },
    "عرض على الخريطة": { EN: "View on Map", RU: "Показать на карте" },
    "موقعنا على الخريطة": { EN: "Our Location on Map", RU: "Наше местоположение" },
    "فتح في Google Maps": { EN: "Open in Google Maps", RU: "Открыть в Google Maps" },
    "تابعنا على منصات التواصل": { EN: "Follow Us on Social Media", RU: "Подписывайтесь в соцсетях" },
    "نموذج حجز المحصول": { EN: "Crop Booking Form", RU: "Форма заказа урожая" },
    "إرسال طلب الحجز": { EN: "Submit Booking Request", RU: "Отправить запрос" },

    "بريدك الإلكتروني": { EN: "Your Email", RU: "Ваш email" },
    "اسم العميل": { EN: "Client Name", RU: "Имя клиента" },
    "اسم الشركة": { EN: "Company Name", RU: "Название компании" },
    "البلد": { EN: "Country", RU: "Страна" },
    "اختر الدولة": { EN: "Select Country", RU: "Выберите страну" },
    "نوع الخدمة": { EN: "Service Type", RU: "Тип услуги" },
    "توريد محلي": { EN: "Local Supply", RU: "Локальные поставки" },
    "تصدير دولي": { EN: "International Export", RU: "Международный экспорт" },
    "نوع المحصول": { EN: "Crop Type", RU: "Тип продукции" },
    "اختر المحصول": { EN: "Select Crop", RU: "Выберите продукт" },
    "الكمية التقديرية (طن)": { EN: "Estimated Quantity (tons)", RU: "Ориентировочный объем (тонн)" },
    "مثال: 25": { EN: "Example: 25", RU: "Пример: 25" },
    "التوقيت المطلوب للاستلام": { EN: "Preferred Delivery Date", RU: "Желаемая дата поставки" },
    "ملاحظات إضافية / تفاصيل المواصفات": { EN: "Additional Notes / Specifications", RU: "Доп. примечания / спецификация" },
    "اكتب أي تفاصيل إضافية عن التعبئة، الحجم، أو الجودة المطلوبة...": { EN: "Write any extra details about packaging, size, or required quality...", RU: "Укажите дополнительные требования к упаковке, размеру или качеству..." },

    "تم تنزيل ملف تجريبي بنجاح.": { EN: "Preview file downloaded successfully.", RU: "Тестовый файл успешно загружен." },
    "من فضلك اكتب اسم العميل.": { EN: "Please enter client name.", RU: "Пожалуйста, укажите имя клиента." },
    "من فضلك اختر الدولة.": { EN: "Please select a country.", RU: "Пожалуйста, выберите страну." },
    "من فضلك اختر نوع المحصول.": { EN: "Please select crop type.", RU: "Пожалуйста, выберите тип продукции." },
    "من فضلك أدخل بريد إلكتروني صحيح.": { EN: "Please enter a valid email.", RU: "Пожалуйста, введите корректный email." },
    "تم الاشتراك في النشرة البريدية بنجاح.": { EN: "Newsletter subscription successful.", RU: "Подписка на рассылку оформлена." },
    "تم تجهيز النموذج تلقائياً بناءً على اختيارك.": { EN: "Form was prefilled automatically based on your selection.", RU: "Форма автоматически заполнена по вашему выбору." },
    "هذا القسم غير متاح حالياً في النسخة التجريبية.": { EN: "This section is not available yet in preview mode.", RU: "Этот раздел пока недоступен в превью." },
    "سياسة الخصوصية قيد الإعداد حالياً.": { EN: "Privacy policy page is under preparation.", RU: "Страница политики конфиденциальности в разработке." },
    "صفحة الشروط والأحكام قيد الإعداد حالياً.": { EN: "Terms and conditions page is under preparation.", RU: "Страница условий использования в разработке." },
    "هذا القسم قيد التطوير حالياً.": { EN: "This section is currently under development.", RU: "Этот раздел сейчас в разработке." },
    "العنصر قيد التفعيل في النسخة الحالية.": { EN: "This item is pending activation in the current version.", RU: "Этот элемент будет активирован в текущей версии." },
    "تم عرض كل الصور المتاحة حالياً.": { EN: "All currently available photos are displayed.", RU: "Показаны все доступные фото." },
    "هذا الزر في وضع تجريبي حالياً.": { EN: "This button is in preview mode for now.", RU: "Эта кнопка пока работает в тестовом режиме." },

    "جاري التنفيذ...": { EN: "Processing...", RU: "Выполняется..." },
    "جاري فتح الرابط...": { EN: "Opening link...", RU: "Открываем ссылку..." },
    "جاري فتح نموذج التواصل...": { EN: "Opening contact form...", RU: "Открываем форму связи..." },
    "جاري فتح نموذج الطلب...": { EN: "Opening order form...", RU: "Открываем форму заказа..." },
    "جاري تشغيل فيديو تجريبي...": { EN: "Playing preview video...", RU: "Запуск демо-видео..." },
    "جاري فتح صفحة المحاصيل...": { EN: "Opening crops page...", RU: "Открываем страницу культур..." },
    "جاري فتح الصفحة الاجتماعية...": { EN: "Opening social page...", RU: "Открываем соцсеть..." }
  };

  function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function getLanguage() {
    const lang = (window.awladLanguage && typeof window.awladLanguage.get === "function"
      ? window.awladLanguage.get()
      : window.localStorage.getItem(STORAGE_KEY) || "AR").toUpperCase();

    return SUPPORTED.includes(lang) ? lang : "AR";
  }

  function translateCore(value, lang) {
    const normalized = normalizeText(value);
    if (!normalized || lang === "AR") return value;

    const leading = (value.match(/^\s*/) || [""])[0];
    const trailing = (value.match(/\s*$/) || [""])[0];

    if (normalized.startsWith("جاري فتح ") && normalized.endsWith("...")) {
      const target = normalized.slice("جاري فتح ".length, -3).trim();
      const translated = lang === "EN" ? `Opening ${target}...` : `Открываем ${target}...`;
      return `${leading}${translated}${trailing}`;
    }

    if (normalized.startsWith("تم إرسال الطلب بنجاح. رقم المتابعة:")) {
      const code = normalized.split(":").slice(1).join(":").trim();
      const translated =
        lang === "EN"
          ? `Request sent successfully. Tracking ID: ${code}`
          : `Запрос успешно отправлен. Номер отслеживания: ${code}`;
      return `${leading}${translated}${trailing}`;
    }

    const entry = DICTIONARY[normalized];
    if (!entry || !entry[lang]) return value;

    return `${leading}${entry[lang]}${trailing}`;
  }

  const textOriginals = new WeakMap();
  const trackedAttributes = [];
  let trackedTextNodes = [];

  function collectTranslatableNodes() {
    if (!document.body) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node || !node.nodeValue || !normalizeText(node.nodeValue)) {
            return NodeFilter.FILTER_REJECT;
          }

          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const blockedTags = ["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "SVG", "PATH"];
          if (blockedTags.includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    trackedTextNodes = [];
    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      trackedTextNodes.push(textNode);
      if (!textOriginals.has(textNode)) {
        textOriginals.set(textNode, textNode.nodeValue);
      }
    }

    const attributesToTrack = ["placeholder", "title", "aria-label", "data-alt"];
    const selector = attributesToTrack.map((attr) => `[${attr}]`).join(",");

    document.querySelectorAll(selector).forEach((element) => {
      attributesToTrack.forEach((attr) => {
        if (!element.hasAttribute(attr)) return;

        const alreadyTracked = trackedAttributes.some((item) => item.element === element && item.attr === attr);
        if (!alreadyTracked) {
          trackedAttributes.push({ element, attr, original: element.getAttribute(attr) || "" });
        }
      });
    });

    const titleElement = document.querySelector("title");
    if (titleElement && !titleElement.dataset.i18nOriginal) {
      titleElement.dataset.i18nOriginal = titleElement.textContent || "";
    }
  }

  function applyLanguage(lang) {
    collectTranslatableNodes();

    trackedTextNodes.forEach((textNode) => {
      if (!textNode || !textNode.parentElement || !textNode.parentElement.isConnected) return;
      const originalValue = textOriginals.get(textNode) || textNode.nodeValue;
      textNode.nodeValue = translateCore(originalValue, lang);
    });

    trackedAttributes.forEach((item) => {
      if (!item.element || !item.element.isConnected) return;
      item.element.setAttribute(item.attr, translateCore(item.original, lang));
    });

    const titleElement = document.querySelector("title");
    if (titleElement && titleElement.dataset.i18nOriginal) {
      titleElement.textContent = translateCore(titleElement.dataset.i18nOriginal, lang);
    }

    document.documentElement.setAttribute("lang", HTML_LANG[lang] || "ar");
    document.documentElement.setAttribute("dir", HTML_DIR[lang] || "rtl");
  }

  function bootstrap() {
    const activeLang = getLanguage();
    applyLanguage(activeLang);
  }

  window.awladI18n = {
    getLanguage,
    translateText(value) {
      const activeLang = getLanguage();
      return translateCore(value, activeLang).trim();
    },
    applyCurrent() {
      applyLanguage(getLanguage());
    },
  };

  window.addEventListener("awlad:lang-change", (event) => {
    const requested = ((event && event.detail && event.detail.language) || getLanguage()).toUpperCase();
    const safeLang = SUPPORTED.includes(requested) ? requested : "AR";
    applyLanguage(safeLang);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();

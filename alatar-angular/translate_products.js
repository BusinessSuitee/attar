const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, 'public', 'assets', 'i18n', 'ar.json');
const enPath = path.join(__dirname, 'public', 'assets', 'i18n', 'en.json');
const ruPath = path.join(__dirname, 'public', 'assets', 'i18n', 'ru.json');

const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ruData = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

enData.products_page = {
  hero: {
    badge: 'Season 2024-2025',
    title: 'Our Crops: From Our Farms to the World',
    desc: 'We offer a diverse selection of premium Egyptian crops, carefully grown and processed to the highest global export standards.',
  },
  filters: {
    all: 'All',
    winter: 'Winter Season',
    summer: 'Summer Season',
    vegetables: 'Vegetables',
    frozen: 'Frozen',
  },
  featured: {
    badge: 'Pride of Egyptian Agriculture',
    title: 'Egyptian Citrus & Oranges',
    desc: 'Alatar is a pioneer in exporting Egyptian citrus, owning vast farms that produce the finest oranges globally demanded due to the ideal climate and fertile soil, with strict quality control from planting to packing.',
    varieties: 'Available Varieties',
    var_navel: 'Navel Oranges',
    var_valencia: 'Valencia Oranges',
    var_baladi: 'Baladi Oranges',
    seasons: 'Supply Seasons',
    month_start: 'November',
    month_end: 'May',
    season_desc: 'Available throughout Winter and Spring',
    feature1: 'Meets European Standards',
    feature2: 'Automated Sterile Packing',
    feature3: 'Refrigerated Shipping',
    btn_quote: 'Request a Quote for Oranges',
    overlay_badge: 'Most Exported Product',
  },
  list: {
    badge: 'Unmatched Variety',
    title: 'List of Seasonal Crops',
    btn_quote: 'Request Pricing',
    empty_title: 'No crops available in this category currently',
    empty_desc: 'Try another category or contact our sales team for upcoming availability.',
  },
  quality: {
    title: 'Quality & Food Safety Guarantee',
    desc: 'We strictly adhere to global food safety standards ensuring our products arrive healthy and safe for consumers. All our stations and farms are tightly monitored and apply the latest agricultural protocols.',
    cert1: 'Agricultural Practices',
    cert2: 'Food Safety',
    cert3: 'Quality Management',
  },
  cta: {
    title: 'Ready to order your crops?',
    desc: 'Our sales team is ready to help you secure the best crops with the specifications and quantities you need for your markets.',
    btn: 'Book an Order Now',
  },
  items: {
    grape_white: {
      title: 'White Grapes',
      season: 'May - August',
      desc: 'Premium white grapes (Superior & Seedless), featuring large seedless berries and a refreshing sweet taste. Highly popular in European markets, carefully picked to ensure quality.',
    },
    orange: {
      title: 'Egyptian Oranges',
      season: 'November - May',
      desc: 'Premium Egyptian oranges, rich in juice and Vitamin C. Considered the most exported product and best suited for juices and fresh consumption in global markets.',
    },
    grape_black: {
      title: 'Premium Black Grapes',
      season: 'May - August',
      desc: 'Premium black seedless grapes, known for their sweet taste and rich color. Carefully sorted according to European export standards to guarantee a longer shelf life.',
    },
    mango: {
      title: 'Egyptian Mangoes',
      season: 'June - September',
      desc: 'Egyptian mangoes of excellent varieties with a unique tropical taste. Chosen and picked at the perfect time to ensure balanced ripeness and irresistible flavor.',
    },
    grape_red: {
      title: 'Excellent Red Grapes',
      season: 'May - August',
      desc: 'Excellent, highly sweet and crunchy red grapes. Symmetrical bunches, cooled and packed using optimal methods to preserve freshness and nutritional value for long periods.',
    },
    strawberry: {
      title: 'Fresh Strawberries',
      season: 'November - April',
      desc: 'Fresh strawberries with a bright red color and distinct taste. Harvested and packed immediately to preserve their quality and delivered swiftly to our clients in all markets.',
    },
    onion: {
      title: 'Egyptian Onions',
      season: 'Available all year',
      desc: 'Solid, high-quality Egyptian onions, featuring a long storage period and high endurance under shipping conditions. Available in sizes that suit all needs.',
    },
    lemon: {
      title: 'Lemons',
      season: 'Available mostly all year',
      desc: 'Egyptian lemons with a high juice percentage and perfect peel. A staple product sorted and processed professionally to meet fresh consumption demands.',
    },
    mandarin: {
      title: 'Mandarins / Tangerines',
      season: 'November - May',
      desc: 'Fresh, easy-to-peel mandarins with a balanced sweet citrus flavor. Carefully packed to retain their aesthetic appearance and distinct taste.',
    },
  },
  whatsapp_message: 'Hello, I would like to inquire about details and pricing for',
};

ruData.products_page = {
  hero: {
    badge: 'Сезон 2024-2025',
    title: 'Наш Урожай: С Ферм по Всему Миру',
    desc: 'Мы предлагаем разнообразный выбор премиальных египетских культур, выращенных с заботой и обработанных по самым высоким мировым экспортным стандартам.',
  },
  filters: {
    all: 'Все',
    winter: 'Зимний Сезон',
    summer: 'Летний Сезон',
    vegetables: 'Овощи',
    frozen: 'Замороженные',
  },
  featured: {
    badge: 'Гордость Египетского Земледелия',
    title: 'Египетские Цитрусовые и Апельсины',
    desc: 'Alatar является пионером в экспорте египетских цитрусовых, обладая обширными фермами, производящими лучшие апельсины, пользующиеся мировым спросом благодаря идеальному климату и плодородной почве, со строгим контролем качества от посадки до упаковки.',
    varieties: 'Доступные Сорта',
    var_navel: 'Апельсины Навель',
    var_valencia: 'Апельсины Валенсия',
    var_baladi: 'Апельсины Балади',
    seasons: 'Сезоны Поставок',
    month_start: 'Ноябрь',
    month_end: 'Май',
    season_desc: 'Доступно в течение всей зимы и весны',
    feature1: 'Соответствует Европейским Стандартам',
    feature2: 'Автоматизированная Стерильная Упаковка',
    feature3: 'Охлаждаемая Доставка',
    btn_quote: 'Запросить Цену на Апельсины',
    overlay_badge: 'Самый Экспортируемый Продукт',
  },
  list: {
    badge: 'Непревзойденное Разнообразие',
    title: 'Список Сезонных Культур',
    btn_quote: 'Запросить Цену',
    empty_title: 'В этой категории в настоящее время нет доступных культур',
    empty_desc:
      'Попробуйте другую категорию или свяжитесь с нашим отделом продаж для получения информации о будущих поступлениях.',
  },
  quality: {
    title: 'Гарантия Качества и Безопасности Продуктов',
    desc: 'Мы строго соблюдаем мировые стандарты безопасности продуктов питания, чтобы наши продукты поступали к потребителям здоровыми и безопасными. Все наши станции и фермы находятся под строгим контролем и применяют новейшие сельскохозяйственные протоколы.',
    cert1: 'Сельскохозяйственная Практика',
    cert2: 'Безопасность Пищевых Продуктов',
    cert3: 'Управление Качеством',
  },
  cta: {
    title: 'Готовы заказать свой урожай?',
    desc: 'Наша команда продаж готова помочь вам зарезервировать лучшие культуры с характеристиками и в количествах, необходимых для ваших рынков.',
    btn: 'Забронировать Заказ Сейчас',
  },
  items: {
    grape_white: {
      title: 'Белый Виноград',
      season: 'Май - Август',
      desc: 'Премиальный белый виноград (Супериор и сидлис), отличающийся крупными ягодами без косточек и освежающим сладким вкусом. Очень популярен на европейских рынках, бережно собран для обеспечения качества.',
    },
    orange: {
      title: 'Египетские Апельсины',
      season: 'Ноябрь - Май',
      desc: 'Премиальные египетские апельсины, богатые соком и витамином С. Считается самым экспортируемым продуктом и лучше всего подходит для соков и потребления в свежем виде на мировых рынках.',
    },
    grape_black: {
      title: 'Премиальный Черный Виноград',
      season: 'Май - Август',
      desc: 'Премиальный черный виноград без косточек, известный своим сладким вкусом и насыщенным цветом. Тщательно отобран в соответствии с европейскими экспортными стандартами для обеспечения более длительного срока хранения.',
    },
    mango: {
      title: 'Египетские Манго',
      season: 'Июнь - Сентябрь',
      desc: 'Египетские манго отличных сортов с уникальным тропическим вкусом. Собираются в идеальное время, чтобы обеспечить сбалансированную спелость и неотразимый вкус.',
    },
    grape_red: {
      title: 'Отличный Красный Виноград',
      season: 'Май - Август',
      desc: 'Отличный, очень сладкий и хрустящий красный виноград. Симметричные гроздья, охлажденные и упакованные оптимальными методами для сохранения свежести и питательной ценности на долгое время.',
    },
    strawberry: {
      title: 'Свежая Клубника',
      season: 'Ноябрь - Апрель',
      desc: 'Свежая клубника яркого красного цвета с ярким вкусом. Собирается и упаковывается немедленно для сохранения качества и быстро доставляется нашим клиентам на все рынки.',
    },
    onion: {
      title: 'Египетский Лук',
      season: 'Доступен круглый год',
      desc: 'Твердый высококачественный египетский лук, отличающийся длительным сроком хранения и высокой выносливостью при транспортировке. Доступен в размерах, подходящих для любых нужд.',
    },
    lemon: {
      title: 'Лимоны',
      season: 'Доступны большую часть года',
      desc: 'Египетские лимоны с высоким процентом сока и идеальной кожурой. Основной продукт, отсортированный и профессионально обработанный для удовлетворения потребностей потребления в свежем виде.',
    },
    mandarin: {
      title: 'Мандарины / Танжерины',
      season: 'Ноябрь - Май',
      desc: 'Свежие, легко очищаемые мандарины со сбалансированным сладким цитрусовым вкусом. Бережно упакованы, чтобы сохранить эстетичный вид и особый вкус.',
    },
  },
  whatsapp_message: 'Здравствуйте, я хотел бы узнать о деталях и ценах на',
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(ruPath, JSON.stringify(ruData, null, 2));

console.log('Done mapping JSON nodes');

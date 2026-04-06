# Product Catalog Brief

هذا الملف هو المرجع المختصر والمنظم لمتطلبات نظام المنتجات والكتالوج المبدئي المطلوب إدخاله في النظام.

## 1. الهدف

الهدف من هذا الملف هو:

- فهم الشكل العام للمنتجات التي تتعامل معها الشركة.
- تصميم `Product CRUD` بشكل صحيح.
- دعم الفلاتر الخاصة بالمنتجات.
- تجهيز `Admin Dashboard` لإضافة وتعديل المنتجات.
- إدخال الكتالوج المبدئي في قاعدة البيانات.
- دعم رفع صور متعددة لكل منتج وتخزينها داخل `wwwroot`.
- عرض صفحة المنتجات بداتا حقيقية من قاعدة البيانات بشكل قريب من صفحات `ecommerce`.
- عدم بناء `order/request APIs` في هذه المرحلة.

## 2. التصنيف العام الصحيح

تصنيف المنتج لا يجب أن يكون `Fruits / Vegetables / Frozen` فقط، لأن `Frozen` تحتوي أيضًا على فواكه وخضروات.

لذلك التصنيف الصحيح يكون على 3 محاور مستقلة:

- `productType`: `Fruit | Vegetable`
- `productState`: `Fresh | Frozen`
- `season`: `Winter | Summer | AllYear`

أمثلة:

- برتقال طازج شتوي = `Fruit + Fresh + Winter`
- مانجو طازجة صيفية = `Fruit + Fresh + Summer`
- مانجو فروزن = `Fruit + Frozen + AllYear` أو حسب السياسة التجارية
- خضار فروزن = `Vegetable + Frozen + AllYear` أو حسب السياسة التجارية

## 3. المطلوب في النظام

### Backend

- بناء `Product CRUD` كامل.
- دعم الفلترة في قائمة المنتجات حسب:
  - `productType`
  - `productState`
  - `season`
- دعم حفظ وصف المنتج.
- دعم الأصناف أو الأنواع الفرعية للمنتج.
- دعم خيارات التعبئة.
- دعم الأوزان.
- دعم الأحجام.
- دعم الدرجات.
- دعم رفع صورة واحدة أو أكثر لكل منتج.

### Admin Dashboard

- شاشة لإضافة منتج جديد.
- شاشة لتعديل وحذف المنتج.
- إمكانية إدخال جميع بيانات المنتج.
- إمكانية رفع عدة صور للمنتج.

### Frontend

- صفحة منتجات تعمل ببيانات حقيقية من الـ API.
- عرض المنتجات بشكل `catalog / ecommerce style`.
- عرض تفاصيل المنتج بشكل واضح.
- إتاحة اختيار المواصفات المتاحة مثل:
  - النوع
  - التعبئة
  - الوزن
  - الحجم
  - الدرجة

### خارج النطاق حاليًا

- عدم بناء `order APIs` أو `request APIs` في هذه المرحلة.

## 4. شكل المنتج المقترح في النظام

المنتج يجب أن يدعم على الأقل الحقول التالية:

- `id`
- `nameAr`
- `nameEn`
- `descriptionAr`
- `descriptionEn`
- `productType`
- `productState`
- `season`
- `varieties[]`
- `packagingOptions[]`
- `weightOptions[]`
- `sizeOptions[]`
- `gradeOptions[]`
- `images[]`
- `isActive`

## 5. قواعد مهمة

- بعض المنتجات لها `varieties` واضحة، وبعضها لا يحتاج إلا اسم المنتج الأساسي فقط.
- بعض المنتجات لها تفاصيل تعبئة وأوزان وأحجام ودرجات واضحة، وبعضها سيتم إدخالها لاحقًا.
- النظام يجب أن يقبل أن تكون بعض القوائم فارغة عند إنشاء بعض المنتجات.
- صور المنتج يجب أن تُخزَّن داخل `wwwroot`.
- المنتج يمكن أن يملك من صورة واحدة إلى عدة صور.

## 6. الكتالوج المبدئي

## 6.1 Fresh Fruits

### Winter

- برتقال
  - varieties: `Valencia`, `Navel`, `Baladi`
  - packaging:
    - صندوق كرتون `Open Top`
    - صندوق كرتون `Telescope`
    - باكيت داخل كرتون `اختياري للسوبر ماركت`
  - weights:
    - `7 kg`
    - `10 kg`
    - `15 kg`
  - sizes:
    - `36`
    - `40`
    - `48`
    - `56`
    - `64`
    - `72`
    - `80`
    - `88`
  - grades:
    - `Extra Class`
    - `Class I (A)`
    - `Class II (B)`

- جريب فروت
- ليمون
- يوسفي
  - varieties:
    - `Murcott`
    - `Mandarin`
- فراولة
  - packaging:
    - بانيت `250 g`
    - بانيت `500 g`
    - كرتونة `2 - 5 kg`
  - sizes:
    - `18 - 35 mm`
  - grades:
    - `Extra`
    - `Class I`
- رمان
- جوافة
- كاكي

### Summer

- مانجو
  - varieties:
    - `Keitt`
    - `Kent`
    - `Heidi`
    - `Naomi`
    - `Taimour`
  - packaging:
    - كرتون `Open Top`
    - كرتون `Telescope`
  - weights:
    - `4 - 5 kg`
    - `7 kg`
  - sizes:
    - `Small`
    - `Medium`
    - `Large`
    - `6 fruits`
    - `12 fruits`
    - `16 fruits`
  - grades:
    - `A`
    - `B`
    - `C`

- عنب
  - varieties:
    - `Flame Seedless`
    - `Crimson Seedless`
    - `Red Globe`
    - `Autumn Royal`
  - colors:
    - أبيض
    - أحمر
    - أسود
  - packaging:
    - بانيت `500 g` داخل كرتونة `5 kg`
    - كرتون `Loose`
  - weights:
    - `4.5 - 5 kg`
  - sizes:
    - `14 - 22 mm`
  - grades:
    - `Extra`
    - `Class I`
    - `Class II`

- خوخ
- نكتارين
- برقوق
- شمام
  - varieties:
    - `Rock`
    - `Yellow`

### AllYear

- أفوكادو
  - varieties:
    - `Hass`
- Custard Apple
- أكادونيا

## 6.2 Fresh Vegetables

### Winter

- بطاطس
  - packaging:
    - شكاير شبك
    - جامبو باج
  - weights:
    - `10 kg`
    - `25 kg`
  - sizes:
    - `35 - 55 mm`
    - `55 - 75 mm`
    - `+75 mm`
  - grades:
    - `Class I`
    - `Class II`

- بصل
  - varieties:
    - أحمر
    - أبيض
    - أخضر
  - packaging:
    - شكاير شبك
    - كرتون
  - weights:
    - `10 kg`
    - `15 kg`
    - `25 kg`
  - sizes:
    - `40 - 60 mm`
    - `60 - 80 mm`
  - grades:
    - `Export Grade`
    - `Local Grade`

- جزر
  - packaging:
    - كرتون
    - شكاير
  - weights:
    - `5 kg`
    - `10 kg`
  - sizes:
    - `150 - 250 g / root`
  - grades:
    - `Class I`
    - `Class II`

- بنجر
- فول
- بروكلي
- كرنب أحمر
- خس Iceberg

### Summer

- طماطم
  - packaging:
    - كرتون مفتوح
    - بلاستيك كريت
  - weights:
    - `5 kg`
    - `7 kg`
    - `10 kg`
  - sizes:
    - `Small`
    - `Medium`
    - `Large`
  - grades:
    - `A`
    - `B`

- طماطم شيري
- فلفل ألوان
  - varieties:
    - أحمر
    - أصفر
  - packaging:
    - كرتون `Open Top`
    - بانيت
  - weights:
    - `4 - 5 kg`
  - sizes:
    - `Small`
    - `Medium`
    - `Large`
  - grades:
    - `A`
    - `B`

- فلفل حار
  - packaging:
    - كرتون `Open Top`
    - بانيت
  - weights:
    - `4 - 5 kg`
  - sizes:
    - `Small`
    - `Medium`
    - `Large`
  - grades:
    - `A`
    - `B`

- باذنجان
  - varieties:
    - أبيض
    - أسود
  - packaging:
    - كرتون مفتوح
  - weights:
    - `5 kg`
    - `7 kg`
  - sizes:
    - `100 - 300 g / fruit`
  - grades:
    - `A`
    - `B`

- فاصوليا خضراء

### AllYear

- بطاطا
- قرع
  - varieties:
    - `Pumpkin`
- قلقاس

## 6.3 Frozen Fruits

الفروزن يحتوي أيضًا على فواكه، لذلك النظام يجب أن يدعم:

- `productType = Fruit`
- `productState = Frozen`

القائمة التفصيلية لمنتجات `Frozen Fruits` لم تُرسل بعد، لكن يجب أن تكون مدعومة بالكامل في التصميم وفي الفلاتر وفي الـ CRUD.

## 6.4 Frozen Vegetables

الفروزن يحتوي أيضًا على خضروات، لذلك النظام يجب أن يدعم:

- `productType = Vegetable`
- `productState = Frozen`

القائمة التفصيلية لمنتجات `Frozen Vegetables` لم تُرسل بعد، لكن يجب أن تكون مدعومة بالكامل في التصميم وفي الفلاتر وفي الـ CRUD.

## 7. الفلاتر المطلوبة في صفحة المنتجات

الفلاتر الأساسية المطلوبة:

- `productType`
- `productState`
- `season`

ويمكن لاحقًا إضافة فلاتر اختيارية مثل:

- `variety`
- `grade`
- `packaging`

## 8. ملاحظات تنفيذية

- المنتجات يجب أن تُعرض من قاعدة البيانات وليس من بيانات ثابتة داخل الواجهة.
- صفحة المنتجات يجب أن تعرض:
  - صورة أو أكثر
  - اسم المنتج
  - وصف المنتج
  - النوع
  - الحالة `Fresh / Frozen`
  - الموسم
  - الأصناف المتاحة
  - التعبئات
  - الأوزان
  - الأحجام
  - الدرجات
- لوحة التحكم يجب أن تسمح بإدارة كل هذه البيانات بسهولة.

## 9. ملاحظات خاصة بالبيانات الحالية

- القائمة الحالية تحتوي تفاصيل كاملة لبعض المنتجات فقط.
- المنتجات التي لا تحتوي تفاصيل تفصيلية الآن يجب إدخالها كمنتجات أساسية، ويمكن استكمال مواصفاتها لاحقًا من لوحة التحكم.
- الفروزن مثبت كتصنيف مدعوم في النظام، لكن تفاصيل الأصناف الخاصة به ستُستكمل عند وصول القائمة.

## 10. Technical Feature Description (Backend + Frontend)

This section defines the implementation path for building product management as a real catalog feature, not only inventory rows.

### 10.1 Current State (As-Is)

Backend currently supports only basic product fields:

- `Name`
- `Sku`
- `Price`
- `StockQuantity`
- `Status`

Current API supports:

- `POST /api/products` for basic create.
- `GET /api/products` for list without catalog filters.

Frontend currently has:

- Admin product form with basic fields only.
- Products page uses mostly static hardcoded cards and local images.
- No real product specs (varieties/packaging/weights/sizes/grades) from API.

### 10.2 Target State (To-Be)

Product feature should support:

- Full product CRUD.
- Category filtering and season filtering.
- Product attributes:
  - varieties
  - packaging options
  - weights
  - sizes
  - grades
  - description
- Multiple image upload per product (stored under `wwwroot`).
- Admin dashboard workflow for create/update product with image upload.
- Products page fully driven by API data in ecommerce-style listing/details.

### 10.3 Data Modeling Decision

To avoid classification ambiguity (because frozen includes both fruits and vegetables), model classification using 3 axes:

- `productType`: `Fruit | Vegetable`
- `productState`: `Fresh | Frozen`
- `season`: `Summer | Winter | AllYear`

UI can still expose a top filter (`Fruits / Vegetables / Frozen`) by mapping:

- `Fruits` => `productType=Fruit`
- `Vegetables` => `productType=Vegetable`
- `Frozen` => `productState=Frozen`

### 10.4 API Surface (Planned)

- `GET /api/products`
  - Query params: `productType?`, `productState?`, `season?`, `search?`
- `GET /api/products/{id}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `POST /api/products/{id}/images` (multipart/form-data, multiple files)
- `DELETE /api/products/{id}/images/{imageId}`

### 10.5 Add Product End-to-End Flow

1. Admin opens add product form in dashboard.
2. Admin submits product metadata (`POST /api/products`).
3. API validates and persists product record, returns `productId`.
4. Frontend uploads 1..N images to `POST /api/products/{productId}/images`.
5. API saves files to `wwwroot/uploads/products/{productId}/...` and stores image metadata in DB.
6. Dashboard refreshes list (`GET /api/products`) and shows created product.
7. Public products page consumes `GET /api/products` and `GET /api/products/{id}` to render real cards/details.

## 11. Existing Files To Be Modified

### 11.1 Backend (existing files)

- `alatar-dotnet/src/Alatar.Domain/Products/Product.cs`
  - Extend entity with bilingual fields and product specifications.
- `alatar-dotnet/src/Alatar.Application/Abstractions/Persistence/IProductRepository.cs`
  - Add richer query/filter and image-related methods.
- `alatar-dotnet/src/Alatar.Application/Abstractions/Persistence/IAlatarDbContext.cs`
  - Add support for product images dataset and operations.
- `alatar-dotnet/src/Alatar.Application/Features/Products/AddProduct/AddProductCommand.cs`
- `alatar-dotnet/src/Alatar.Application/Features/Products/AddProduct/AddProductCommandHandler.cs`
- `alatar-dotnet/src/Alatar.Application/Features/Products/AddProduct/AddProductValidator.cs`
  - Expand request/validation for catalog fields.
- `alatar-dotnet/src/Alatar.Application/Features/Products/GetProducts/GetProductsQuery.cs`
- `alatar-dotnet/src/Alatar.Application/Features/Products/GetProducts/GetProductsQueryHandler.cs`
- `alatar-dotnet/src/Alatar.Application/Features/Products/GetProducts/ProductListItemResponse.cs`
  - Add filter support and richer response payload.
- `alatar-dotnet/src/Alatar.Infrastructure/Persistence/AlatarDbContext.cs`
  - Map new columns/entities.
- `alatar-dotnet/src/Alatar.Infrastructure/Persistence/SqlProductRepository.cs`
  - Implement extended repository behavior.
- `alatar-dotnet/src/Alatar.Infrastructure/Persistence/DatabaseInitializer.cs`
  - Ensure schema changes and seed full catalog data.
- `alatar-dotnet/src/Alatar.Infrastructure/DependencyInjection.cs`
  - Register image storage service.
- `alatar-dotnet/src/Alatar.Api/Controllers/ProductsController.cs`
  - Expand to full CRUD + image endpoints.
- `alatar-dotnet/src/Alatar.Api/Contracts/Products/CreateProductRequest.cs`
  - Expand create contract.
- `alatar-dotnet/src/Alatar.Api/Program.cs`
  - Enable static files and upload-friendly configuration.

### 11.2 Frontend (existing files)

- `alatar-angular/src/app/core/products/product.service.ts`
  - Replace basic model with full product DTOs and endpoints.
- `alatar-angular/src/app/pages/products/products.page.ts`
  - Replace static data with API-driven signals/state.
- `alatar-angular/src/app/pages/products/products.page.html`
  - Render real product cards/details/specs.
- `alatar-angular/src/app/pages/products/products.page.css`
  - Styling updates for real catalog layout.
- `alatar-angular/src/app/pages/admin-dashboard/admin-dashboard.page.ts`
  - Expand product form + upload flow.
- `alatar-angular/src/app/pages/admin-dashboard/admin-dashboard.page.html`
  - Add fields for catalog specs and images.
- `alatar-angular/src/app/pages/admin-dashboard/admin-dashboard.page.css`
  - Styles for expanded admin product management UI.
- `alatar-angular/public/assets/i18n/ar.json`
- `alatar-angular/public/assets/i18n/en.json`
  - Add/adjust translation keys for new labels and actions.

## 12. New Files To Be Added

### 12.1 Backend (new)

- `alatar-dotnet/src/Alatar.Domain/Products/ProductImage.cs`
- `alatar-dotnet/src/Alatar.Application/Abstractions/Storage/IImageStorageService.cs`
- `alatar-dotnet/src/Alatar.Infrastructure/Storage/LocalImageStorageService.cs`
- `alatar-dotnet/src/Alatar.Application/Features/Products/GetProductById/*`
- `alatar-dotnet/src/Alatar.Application/Features/Products/UpdateProduct/*`
- `alatar-dotnet/src/Alatar.Application/Features/Products/DeleteProduct/*`
- `alatar-dotnet/src/Alatar.Application/Features/Products/AddProductImage/*`
- `alatar-dotnet/src/Alatar.Application/Features/Products/DeleteProductImage/*`
- `alatar-dotnet/src/Alatar.Api/Contracts/Products/UpdateProductRequest.cs`
- `alatar-dotnet/src/Alatar.Api/Contracts/Products/ProductDetailsResponse.cs`

### 12.2 Frontend (optional new)

- `alatar-angular/src/app/core/products/product.models.ts`
  - Extract interfaces/types to keep service/components clean.

## 13. Implementation Path (Execution Sequence)

### Phase 1: Domain + Schema

1. Extend `Product` entity with catalog fields.
2. Add `ProductImage` entity.
3. Update `AlatarDbContext` mappings.
4. Update initializer SQL to ensure new columns/tables.

### Phase 2: Application Layer

1. Extend create product command/handler/validator.
2. Add update/delete/get-by-id features.
3. Extend get-products with filters.
4. Add image add/delete commands.

### Phase 3: API Layer

1. Expand product contracts.
2. Expand `ProductsController` endpoints.
3. Enable static file serving from `wwwroot`.

### Phase 4: Frontend Admin

1. Expand dashboard product form (bilingual + specs).
2. Submit product metadata first.
3. Upload images after receiving `productId`.
4. Refresh list with real API data.

### Phase 5: Frontend Catalog

1. Replace hardcoded products with API queries.
2. Add filters (type/state/season).
3. Render product details (description/specs/images).
4. Handle empty/no-image states gracefully.

### Phase 6: Seed + Verification

1. Seed provided products in DB (without requiring images initially).
2. Verify filtering behavior and product details.
3. Verify image upload/persistence and public image URLs.
4. Verify admin and public pages against real API responses.

## 14. Scope Guard

Out of scope for this milestone:

- Building order/request APIs.
- Checkout/cart/payment flow.
- Inventory reservation logic.

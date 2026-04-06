using Alatar.Domain.Categories;
using Alatar.Domain.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Alatar.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task EnsureDatabaseCreatedAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AlatarDbContext>();

        await dbContext.Database.EnsureCreatedAsync();
        await EnsureCategoriesTableExistsAsync(dbContext);
        await EnsureContactsTableExistsAsync(dbContext);
        await EnsureProductsTableExistsAsync(dbContext);
        await EnsureOrderRequestsTableExistsAsync(dbContext);
        await EnsureProductImagesTableExistsAsync(dbContext);
        await SeedDefaultCategoriesAsync(dbContext);
        await SeedDefaultProductsAsync(dbContext);
    }

    private static async Task EnsureCategoriesTableExistsAsync(AlatarDbContext dbContext)
    {
        const string sql = """
                           IF OBJECT_ID(N'[dbo].[Categories]', N'U') IS NULL
                           BEGIN
                               CREATE TABLE [dbo].[Categories]
                               (
                                   [Id] UNIQUEIDENTIFIER NOT NULL,
                                   [Name] NVARCHAR(120) NOT NULL,
                                   [NormalizedName] NVARCHAR(120) NOT NULL,
                                   [Type] NVARCHAR(32) NOT NULL,
                                   [Season] NVARCHAR(32) NOT NULL,
                                   [CreatedAtUtc] DATETIME2 NOT NULL,
                                   CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
                               );
                           END

                           IF NOT EXISTS (
                               SELECT 1
                               FROM sys.indexes
                               WHERE name = N'IX_Categories_NormalizedName'
                                   AND object_id = OBJECT_ID(N'[dbo].[Categories]')
                           )
                           BEGIN
                               CREATE UNIQUE INDEX [IX_Categories_NormalizedName]
                                   ON [dbo].[Categories]([NormalizedName]);
                           END

                           IF COL_LENGTH(N'[dbo].[Categories]', N'Type') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Categories]
                               ADD [Type] NVARCHAR(32) NOT NULL CONSTRAINT [DF_Categories_Type] DEFAULT N'Fruits';
                           END

                           IF COL_LENGTH(N'[dbo].[Categories]', N'Season') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Categories]
                               ADD [Season] NVARCHAR(32) NOT NULL CONSTRAINT [DF_Categories_Season] DEFAULT N'AllYear';
                           END
                           """;

        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static async Task SeedDefaultCategoriesAsync(AlatarDbContext dbContext)
    {
        var hasCategories = await dbContext.Categories.AnyAsync();
        if (hasCategories)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var seedSql = """
                      INSERT INTO [dbo].[Categories] ([Id], [Name], [NormalizedName], [Type], [Season], [CreatedAtUtc])
                      VALUES
                          (NEWID(), N'فواكه صيفية', N'فواكه صيفية', N'Fruits', N'Summer', @p0),
                          (NEWID(), N'فواكه شتوية', N'فواكه شتوية', N'Fruits', N'Winter', @p0),
                          (NEWID(), N'فواكه طول العام', N'فواكه طول العام', N'Fruits', N'AllYear', @p0),
                          (NEWID(), N'خضروات صيفية', N'خضروات صيفية', N'Vegetables', N'Summer', @p0),
                          (NEWID(), N'خضروات شتوية', N'خضروات شتوية', N'Vegetables', N'Winter', @p0),
                          (NEWID(), N'خضروات طول العام', N'خضروات طول العام', N'Vegetables', N'AllYear', @p0),
                          (NEWID(), N'مجمدات', N'مجمدات', N'Frozen', N'AllYear', @p0);
                      """;

        await dbContext.Database.ExecuteSqlRawAsync(seedSql, now);
    }

    private static Task EnsureContactsTableExistsAsync(AlatarDbContext dbContext)
    {
        const string sql = """
                           IF OBJECT_ID(N'[dbo].[Contacts]', N'U') IS NULL
                           BEGIN
                               CREATE TABLE [dbo].[Contacts]
                               (
                                   [Id] UNIQUEIDENTIFIER NOT NULL,
                                   [FullName] NVARCHAR(200) NOT NULL,
                                   [PhoneNumber] NVARCHAR(64) NOT NULL,
                                   [ServiceType] NVARCHAR(16) NOT NULL,
                                   [Status] NVARCHAR(32) NOT NULL CONSTRAINT [DF_Contacts_Status] DEFAULT N'InProgress',
                                   [CompanyName] NVARCHAR(200) NULL,
                                   [Country] NVARCHAR(128) NULL,
                                   [Crop] NVARCHAR(128) NULL,
                                   [QuantityTons] DECIMAL(18,2) NULL,
                                   [DeliveryWindow] NVARCHAR(128) NULL,
                                   [Notes] NVARCHAR(2000) NULL,
                                   [CreatedAtUtc] DATETIME2 NOT NULL,
                                   CONSTRAINT [PK_Contacts] PRIMARY KEY ([Id])
                               );
                           END

                           IF COL_LENGTH(N'[dbo].[Contacts]', N'Status') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Contacts]
                               ADD [Status] NVARCHAR(32) NOT NULL CONSTRAINT [DF_Contacts_Status] DEFAULT N'InProgress';
                           END
                           """;

        return dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static Task EnsureOrderRequestsTableExistsAsync(AlatarDbContext dbContext)
    {
        const string sql = """
                           IF OBJECT_ID(N'[dbo].[OrderRequests]', N'U') IS NULL
                           BEGIN
                               CREATE TABLE [dbo].[OrderRequests]
                               (
                                   [Id] UNIQUEIDENTIFIER NOT NULL,
                                   [ProductId] UNIQUEIDENTIFIER NOT NULL,
                                   [ProductNameSnapshot] NVARCHAR(220) NOT NULL,
                                   [RequesterName] NVARCHAR(200) NOT NULL,
                                   [PhoneNumber] NVARCHAR(64) NOT NULL,
                                   [QuantityTons] DECIMAL(18,2) NOT NULL,
                                   [SelectedVariety] NVARCHAR(120) NULL,
                                   [SelectedPackaging] NVARCHAR(120) NULL,
                                   [SelectedWeight] NVARCHAR(120) NULL,
                                   [SelectedSize] NVARCHAR(120) NULL,
                                   [SelectedGrade] NVARCHAR(120) NULL,
                                   [Status] NVARCHAR(32) NOT NULL CONSTRAINT [DF_OrderRequests_Status] DEFAULT N'New',
                                   [IsDeleted] BIT NOT NULL CONSTRAINT [DF_OrderRequests_IsDeleted] DEFAULT 0,
                                   [DeletedAtUtc] DATETIME2 NULL,
                                   [CreatedAtUtc] DATETIME2 NOT NULL,
                                   [UpdatedAtUtc] DATETIME2 NOT NULL,
                                   CONSTRAINT [PK_OrderRequests] PRIMARY KEY ([Id]),
                                   CONSTRAINT [FK_OrderRequests_Products_ProductId]
                                       FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([Id])
                               );
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'ProductNameSnapshot') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [ProductNameSnapshot] NVARCHAR(220) NOT NULL CONSTRAINT [DF_OrderRequests_ProductNameSnapshot] DEFAULT N'';
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'RequesterName') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [RequesterName] NVARCHAR(200) NOT NULL CONSTRAINT [DF_OrderRequests_RequesterName] DEFAULT N'';
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'PhoneNumber') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [PhoneNumber] NVARCHAR(64) NOT NULL CONSTRAINT [DF_OrderRequests_PhoneNumber] DEFAULT N'';
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'QuantityTons') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [QuantityTons] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_OrderRequests_QuantityTons] DEFAULT 0;
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'SelectedVariety') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [SelectedVariety] NVARCHAR(120) NULL;
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'SelectedPackaging') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [SelectedPackaging] NVARCHAR(120) NULL;
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'SelectedWeight') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [SelectedWeight] NVARCHAR(120) NULL;
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'SelectedSize') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [SelectedSize] NVARCHAR(120) NULL;
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'SelectedGrade') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [SelectedGrade] NVARCHAR(120) NULL;
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'Status') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [Status] NVARCHAR(32) NOT NULL CONSTRAINT [DF_OrderRequests_Status] DEFAULT N'New';
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'IsDeleted') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [IsDeleted] BIT NOT NULL CONSTRAINT [DF_OrderRequests_IsDeleted] DEFAULT 0;
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'DeletedAtUtc') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [DeletedAtUtc] DATETIME2 NULL;
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'CreatedAtUtc') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [CreatedAtUtc] DATETIME2 NOT NULL CONSTRAINT [DF_OrderRequests_CreatedAtUtc] DEFAULT SYSUTCDATETIME();
                           END

                           IF COL_LENGTH(N'[dbo].[OrderRequests]', N'UpdatedAtUtc') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               ADD [UpdatedAtUtc] DATETIME2 NOT NULL CONSTRAINT [DF_OrderRequests_UpdatedAtUtc] DEFAULT SYSUTCDATETIME();
                           END

                           IF NOT EXISTS (
                               SELECT 1
                               FROM sys.indexes
                               WHERE name = N'IX_OrderRequests_ProductId'
                                   AND object_id = OBJECT_ID(N'[dbo].[OrderRequests]')
                           )
                           BEGIN
                               CREATE INDEX [IX_OrderRequests_ProductId]
                                   ON [dbo].[OrderRequests]([ProductId]);
                           END

                           IF NOT EXISTS (
                               SELECT 1
                               FROM sys.indexes
                               WHERE name = N'IX_OrderRequests_Status'
                                   AND object_id = OBJECT_ID(N'[dbo].[OrderRequests]')
                           )
                           BEGIN
                               CREATE INDEX [IX_OrderRequests_Status]
                                   ON [dbo].[OrderRequests]([Status]);
                           END

                           IF NOT EXISTS (
                               SELECT 1
                               FROM sys.indexes
                               WHERE name = N'IX_OrderRequests_IsDeleted'
                                   AND object_id = OBJECT_ID(N'[dbo].[OrderRequests]')
                           )
                           BEGIN
                               CREATE INDEX [IX_OrderRequests_IsDeleted]
                                   ON [dbo].[OrderRequests]([IsDeleted]);
                           END

                           IF NOT EXISTS (
                               SELECT 1
                               FROM sys.indexes
                               WHERE name = N'IX_OrderRequests_CreatedAtUtc'
                                   AND object_id = OBJECT_ID(N'[dbo].[OrderRequests]')
                           )
                           BEGIN
                               CREATE INDEX [IX_OrderRequests_CreatedAtUtc]
                                   ON [dbo].[OrderRequests]([CreatedAtUtc]);
                           END

                           IF OBJECT_ID(N'[dbo].[Products]', N'U') IS NOT NULL
                               AND NOT EXISTS (
                                   SELECT 1
                                   FROM sys.foreign_keys
                                   WHERE name = N'FK_OrderRequests_Products_ProductId'
                               )
                           BEGIN
                               ALTER TABLE [dbo].[OrderRequests]
                               WITH CHECK
                               ADD CONSTRAINT [FK_OrderRequests_Products_ProductId]
                                   FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products]([Id]);
                           END
                           """;

        return dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static Task EnsureProductsTableExistsAsync(AlatarDbContext dbContext)
    {
        const string sql = """
                           IF OBJECT_ID(N'[dbo].[Products]', N'U') IS NULL
                           BEGIN
                               CREATE TABLE [dbo].[Products]
                               (
                                   [Id] UNIQUEIDENTIFIER NOT NULL,
                                   [Name] NVARCHAR(200) NOT NULL,
                                   [NameAr] NVARCHAR(200) NOT NULL CONSTRAINT [DF_Products_NameAr] DEFAULT N'',
                                   [Sku] NVARCHAR(64) NOT NULL,
                                   [Price] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Products_Price] DEFAULT 0,
                                   [StockQuantity] INT NOT NULL CONSTRAINT [DF_Products_StockQuantity] DEFAULT 0,
                                   [DescriptionEn] NVARCHAR(2000) NOT NULL CONSTRAINT [DF_Products_DescriptionEn] DEFAULT N'',
                                   [DescriptionAr] NVARCHAR(2000) NOT NULL CONSTRAINT [DF_Products_DescriptionAr] DEFAULT N'',
                                   [ProductType] NVARCHAR(24) NOT NULL CONSTRAINT [DF_Products_ProductType] DEFAULT N'Fruit',
                                   [ProductState] NVARCHAR(24) NOT NULL CONSTRAINT [DF_Products_ProductState] DEFAULT N'Fresh',
                                   [Season] NVARCHAR(24) NOT NULL CONSTRAINT [DF_Products_Season] DEFAULT N'AllYear',
                                   [VarietiesJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_VarietiesJson] DEFAULT N'[]',
                                   [PackagingOptionsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_PackagingOptionsJson] DEFAULT N'[]',
                                   [WeightOptionsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_WeightOptionsJson] DEFAULT N'[]',
                                   [SizeOptionsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_SizeOptionsJson] DEFAULT N'[]',
                                   [GradeOptionsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_GradeOptionsJson] DEFAULT N'[]',
                                   [Status] NVARCHAR(32) NOT NULL CONSTRAINT [DF_Products_Status] DEFAULT N'Active',
                                   [CreatedAtUtc] DATETIME2 NOT NULL,
                                   [UpdatedAtUtc] DATETIME2 NOT NULL,
                                   CONSTRAINT [PK_Products] PRIMARY KEY ([Id])
                               );
                           END

                           IF NOT EXISTS (
                               SELECT 1
                               FROM sys.indexes
                               WHERE name = N'IX_Products_Sku'
                                   AND object_id = OBJECT_ID(N'[dbo].[Products]')
                           )
                           BEGIN
                               CREATE UNIQUE INDEX [IX_Products_Sku]
                                   ON [dbo].[Products]([Sku]);
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'NameAr') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [NameAr] NVARCHAR(200) NOT NULL CONSTRAINT [DF_Products_NameAr] DEFAULT N'';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'DescriptionEn') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [DescriptionEn] NVARCHAR(2000) NOT NULL CONSTRAINT [DF_Products_DescriptionEn] DEFAULT N'';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'DescriptionAr') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [DescriptionAr] NVARCHAR(2000) NOT NULL CONSTRAINT [DF_Products_DescriptionAr] DEFAULT N'';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'ProductType') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [ProductType] NVARCHAR(24) NOT NULL CONSTRAINT [DF_Products_ProductType] DEFAULT N'Fruit';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'ProductState') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [ProductState] NVARCHAR(24) NOT NULL CONSTRAINT [DF_Products_ProductState] DEFAULT N'Fresh';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'Season') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [Season] NVARCHAR(24) NOT NULL CONSTRAINT [DF_Products_Season] DEFAULT N'AllYear';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'VarietiesJson') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [VarietiesJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_VarietiesJson] DEFAULT N'[]';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'PackagingOptionsJson') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [PackagingOptionsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_PackagingOptionsJson] DEFAULT N'[]';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'WeightOptionsJson') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [WeightOptionsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_WeightOptionsJson] DEFAULT N'[]';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'SizeOptionsJson') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [SizeOptionsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_SizeOptionsJson] DEFAULT N'[]';
                           END

                           IF COL_LENGTH(N'[dbo].[Products]', N'GradeOptionsJson') IS NULL
                           BEGIN
                               ALTER TABLE [dbo].[Products]
                               ADD [GradeOptionsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Products_GradeOptionsJson] DEFAULT N'[]';
                           END
                           """;

        return dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static async Task SeedDefaultProductsAsync(AlatarDbContext dbContext)
    {
        var hasProducts = await dbContext.Products.AnyAsync();
        if (hasProducts) return;

        var products = new List<Product>
        {
            // ─── فواكه شتوية ──────────────────────────────────────────────────────────
            Product.Create(
                "Egyptian Oranges", "برتقال مصري", "ORANGE-EG", 0, 0,
                "Premium Egyptian oranges known for exceptional juice content and sweetness. Available in Valencia, Navel, and Baladi varieties, hand-picked and packed to European export standards.",
                "برتقال مصري فاخر بعصارة غنية وطعم مميز، متوفر بأصناف فالنسيا وأبو سرة والبلدي، يُقطف ويُعبأ وفق المواصفات الأوروبية.",
                ProductType.Fruit, ProductState.Fresh, Season.Winter,
                ["Valencia", "Navel (أبو سرة)", "Baladi (بلدي)"],
                ["Open Top Carton Box", "Telescope Carton Box", "Packet inside Carton (Supermarket)"],
                ["7 kg", "10 kg", "15 kg"],
                ["36", "40", "48", "56", "64", "72", "80", "88"],
                ["Extra Class", "Class I (A)", "Class II (B)"]),

            Product.Create(
                "Grapefruit", "جريب فروت", "GRAPEFRUIT-EG", 0, 0,
                "Fresh Egyptian grapefruit with a perfect balance of sweetness and tang. Rich in vitamin C, available in Star Ruby and Marsh Seedless varieties.",
                "جريب فروت مصري طازج بتوازن مثالي بين الحلاوة والحموضة، غني بفيتامين C، متوفر بأصناف ستار روبي وماش سيدلس.",
                ProductType.Fruit, ProductState.Fresh, Season.Winter,
                ["Star Ruby", "Marsh Seedless", "Thompson"],
                ["Open Top Carton Box", "Telescope Carton Box"],
                ["10 kg", "15 kg"],
                ["27", "32", "36", "40", "48"],
                ["Extra Class", "Class I (A)", "Class II (B)"]),

            Product.Create(
                "Lemons", "ليمون", "LEMON-EG", 0, 0,
                "Egyptian lemons with high juice content and perfect peel integrity. Professionally sorted and packed for fresh consumption markets worldwide.",
                "ليمون مصري بنسبة عصارة عالية وقشرة مثالية، يُفرز ويُجهز باحترافية لأسواق الاستهلاك الطازج حول العالم.",
                ProductType.Fruit, ProductState.Fresh, Season.Winter,
                ["Eureka", "Lisbon"],
                ["Open Top Carton Box", "Mesh Bag"],
                ["5 kg", "10 kg", "15 kg"],
                ["40", "48", "56", "64", "72"],
                ["Extra Class", "Class I", "Class II"]),

            Product.Create(
                "Mandarins / Murcott", "يوسفي / مندرين", "MANDARIN-EG", 0, 0,
                "Fresh, easy-to-peel mandarins with a perfectly balanced sweet citrus flavour. Carefully packed to retain appearance and taste.",
                "يوسفي طازج سهل التقشير بنكهة حمضية حلوة متوازنة، يُعبأ بعناية للحفاظ على مظهره وطعمه المميز.",
                ProductType.Fruit, ProductState.Fresh, Season.Winter,
                ["Murcott", "W. Murcott", "Fremont", "Nour"],
                ["Open Top Carton Box", "Telescope Carton Box", "Packet inside Carton"],
                ["7 kg", "10 kg", "15 kg"],
                ["1", "2", "3", "4", "5", "6"],
                ["Extra Class", "Class I (A)", "Class II (B)"]),

            Product.Create(
                "Fresh Strawberries", "فراولة طازجة", "STRAWBERRY-EG", 0, 0,
                "Fresh strawberries with bright red colour and a distinct flavour. Harvested and packed immediately to preserve quality for all markets.",
                "فراولة طازجة بلون أحمر زاهي ومذاق مميز، تُحصد وتُعبأ مباشرة للحفاظ على جودتها لجميع الأسواق.",
                ProductType.Fruit, ProductState.Fresh, Season.Winter,
                ["Festival", "Fortuna", "Camarosa"],
                ["Punnet 250 g", "Punnet 500 g", "2 kg Carton Box", "5 kg Carton Box"],
                ["2 kg", "5 kg"],
                ["18–25 mm", "25–35 mm"],
                ["Extra", "Class I"]),

            Product.Create(
                "Pomegranates", "رمان", "POMEGRANATE-EG", 0, 0,
                "Egyptian pomegranates with rich ruby-red arils, high in antioxidants. Available in Wonderful, 116 and Manfalouty varieties.",
                "رمان مصري بحبوب حمراء غنية وعالية بمضادات الأكسدة، متوفر بأصناف ووندرفول و116 والمنفلوطي.",
                ProductType.Fruit, ProductState.Fresh, Season.Winter,
                ["Wonderful", "116", "Manfalouty (منفلوطي)"],
                ["Open Top Carton Box", "Telescope Carton Box"],
                ["5 kg", "7 kg", "10 kg"],
                ["8", "10", "12", "14", "16"],
                ["Extra Class", "Class I", "Class II"]),

            Product.Create(
                "Guava", "جوافة", "GUAVA-EG", 0, 0,
                "Sweet, aromatic Egyptian guava with firm white or pink flesh. Rich in vitamin C and available in Banati and Crystal varieties.",
                "جوافة مصرية حلوة وعطرية بلب أبيض أو وردي متماسك، غنية بفيتامين C، متوفرة بأصناف بناتي وكريستال.",
                ProductType.Fruit, ProductState.Fresh, Season.Winter,
                ["Banati", "Crystal", "Safawi"],
                ["Open Top Carton Box"],
                ["4 kg", "5 kg"],
                ["Small", "Medium", "Large"],
                ["A", "B"]),

            Product.Create(
                "Persimmon (Kaki)", "كاكي", "KAKI-EG", 0, 0,
                "Firm, sweet Egyptian persimmon with a deep orange colour and smooth texture. Available in Triumph and Sharon varieties.",
                "كاكي مصري متماسك وحلو بلون برتقالي داكن وملمس ناعم، متوفر بأصناف ترايمف وشارون.",
                ProductType.Fruit, ProductState.Fresh, Season.Winter,
                ["Triumph", "Sharon"],
                ["Open Top Carton Box"],
                ["4 kg", "5 kg"],
                ["8", "10", "12"],
                ["A", "B"]),

            // ─── فواكه صيفية ──────────────────────────────────────────────────────────
            Product.Create(
                "Egyptian Mangoes", "مانجو مصرية", "MANGO-EG", 0, 0,
                "Egyptian mangoes of excellent varieties with a unique tropical taste. Chosen and picked at the perfect time to ensure balanced ripeness and irresistible flavour.",
                "مانجو مصرية بأصنافها الممتازة والمذاق الاستوائي الفريد، ثمار مختارة ومقطوفة في الوقت المثالي لضمان نضج متوازن وطعم لا يقاوم.",
                ProductType.Fruit, ProductState.Fresh, Season.Summer,
                ["Keitt (كيت)", "Kent (كنت)", "Heidi (هايدي)", "Naomi (نعومي)", "Taimour (تيمور)", "Zebda (زبده)", "Alphonso (ألفونسو)"],
                ["Open Top Carton Box", "Telescope Carton Box"],
                ["4–5 kg", "7 kg"],
                ["Small (16 fruits)", "Medium (12 fruits)", "Large (8 fruits)", "Extra Large (6 fruits)"],
                ["A", "B", "C"]),

            Product.Create(
                "Premium Grapes", "عنب فاخر", "GRAPE-EG", 0, 0,
                "Carefully selected Egyptian grape clusters with export specifications catering to European market tastes. Available in seedless and seeded varieties.",
                "عناقيد عنب مصري مختارة بعناية بمواصفات التصدير لأذواق الأسواق الأوروبية، متوفر بأصناف خالية من البذور وبذرية.",
                ProductType.Fruit, ProductState.Fresh, Season.Summer,
                ["Flame Seedless (فليم)", "Crimson Seedless (كريمسون)", "Red Globe", "Autumn Royal", "Superior White (أبيض)"],
                ["Punnet 500 g × 5 kg Carton", "Loose Carton"],
                ["4.5 kg", "5 kg"],
                ["14–16 mm", "16–18 mm", "18–22 mm"],
                ["Extra", "Class I", "Class II"]),

            Product.Create(
                "Peaches", "خوخ", "PEACH-EG", 0, 0,
                "Sweet, juicy Egyptian peaches with a golden-red skin and firm flesh. Excellent for fresh consumption and export to European markets.",
                "خوخ مصري حلو وعصير بقشرة ذهبية حمراء ولب متماسك، ممتاز للاستهلاك الطازج والتصدير للأسواق الأوروبية.",
                ProductType.Fruit, ProductState.Fresh, Season.Summer,
                ["Flordaprince", "Early Grande", "Desert Red"],
                ["Open Top Carton Box", "Telescope Carton Box"],
                ["4 kg", "5 kg"],
                ["AA", "A", "B"],
                ["Extra Class", "Class I", "Class II"]),

            Product.Create(
                "Nectarines", "نكتارين", "NECTARINE-EG", 0, 0,
                "Smooth-skinned, sweet nectarines grown in Egyptian conditions. A premium summer fruit ideal for European and Gulf export.",
                "نكتارين ناعم الجلد وحلو، مُزروع في الظروف المصرية، فاكهة صيفية فاخرة مثالية للتصدير لأوروبا والخليج.",
                ProductType.Fruit, ProductState.Fresh, Season.Summer,
                ["Early Sungrand", "Fantasia"],
                ["Open Top Carton Box"],
                ["4 kg", "5 kg"],
                ["AA", "A", "B"],
                ["Extra Class", "Class I", "Class II"]),

            Product.Create(
                "Plums", "برقوق", "PLUM-EG", 0, 0,
                "Fresh Egyptian plums with a deep purple colour and sweet-tart taste. Packed carefully to maintain quality through the supply chain.",
                "برقوق مصري طازج بلون بنفسجي داكن وطعم حلو حامضي، يُعبأ بعناية للحفاظ على الجودة عبر سلسلة التوريد.",
                ProductType.Fruit, ProductState.Fresh, Season.Summer,
                ["Santa Rosa", "Angelino", "Black Amber"],
                ["Open Top Carton Box", "Telescope Carton Box"],
                ["4 kg", "5 kg"],
                ["AA", "A", "B"],
                ["Extra Class", "Class I", "Class II"]),

            Product.Create(
                "Cantaloupe / Melon", "شمام", "MELON-EG", 0, 0,
                "Sweet Egyptian cantaloupe and rock melon with a firm texture and fragrant aroma. A top summer export crop.",
                "شمام مصري حلو وعطري بملمس متماسك، من أبرز محاصيل التصدير الصيفية.",
                ProductType.Fruit, ProductState.Fresh, Season.Summer,
                ["Rock Melon", "Yellow Melon"],
                ["Open Top Carton Box"],
                ["5 kg", "7 kg"],
                ["4", "6", "8", "10"],
                ["A", "B"]),

            // ─── فواكه طول العام ──────────────────────────────────────────────────────
            Product.Create(
                "Hass Avocado", "أفوكادو هاس", "AVOCADO-EG", 0, 0,
                "Premium Hass avocados grown in Egyptian conditions. Creamy texture, rich flavour, exported fresh to European and Gulf markets.",
                "أفوكادو هاس فاخر مُزرع في مصر، بلب كريمي وطعم غني، يُصدَّر طازجاً للأسواق الأوروبية والخليجية.",
                ProductType.Fruit, ProductState.Fresh, Season.AllYear,
                ["Hass"],
                ["Open Top Carton Box", "Telescope Carton Box"],
                ["4 kg", "5 kg"],
                ["12", "14", "16", "18", "20", "24"],
                ["Extra Class", "Class I", "Class II"]),

            Product.Create(
                "Custard Apple (Cherimoya)", "قشطة / أتا", "CUSTARDAPPLE-EG", 0, 0,
                "Exotic Egyptian custard apple with a sweet, creamy white flesh. A premium tropical fruit with growing demand in European speciality markets.",
                "قشطة مصرية فاخرة بلب أبيض كريمي وحلو، فاكهة استوائية نادرة يتزايد الطلب عليها في أسواق الفاخر الأوروبية.",
                ProductType.Fruit, ProductState.Fresh, Season.AllYear,
                ["Balady (بلدي)", "Hybrid"],
                ["Open Top Carton Box"],
                ["3 kg", "4 kg"],
                ["Small", "Medium", "Large"],
                ["A", "B"]),

            Product.Create(
                "Macadamia", "ماكاديميا", "MACADAMIA-EG", 0, 0,
                "Egyptian-grown macadamia nuts with a rich buttery flavour. Available shelled and unshelled for premium retail and food service markets.",
                "ماكاديميا مصرية بنكهة زبدانية غنية، متوفرة مقشرة وغير مقشرة لأسواق التجزئة الفاخرة والخدمات الغذائية.",
                ProductType.Fruit, ProductState.Fresh, Season.AllYear,
                ["Macadamia integrifolia", "Macadamia tetraphylla"],
                ["Vacuum Bag", "Retail Carton"],
                ["5 kg", "10 kg"],
                ["Whole", "Halves"],
                ["A", "B"]),

            // ─── خضراوات شتوية ────────────────────────────────────────────────────────
            Product.Create(
                "Egyptian Potatoes", "بطاطس مصرية", "POTATO-EG", 0, 0,
                "High-quality Egyptian potatoes with excellent storage capacity and low sugar content. Ideal for frying, boiling, and processing.",
                "بطاطس مصرية عالية الجودة بقدرة تخزين ممتازة ومحتوى سكر منخفض، مثالية للقلي والسلق والتصنيع.",
                ProductType.Vegetable, ProductState.Fresh, Season.Winter,
                ["Diamant", "Spunta", "Lady Rosetta"],
                ["Mesh Bag", "Jumbo Bag", "Carton Box"],
                ["10 kg", "25 kg"],
                ["35–55 mm", "55–75 mm", "+75 mm"],
                ["Class I", "Class II"]),

            Product.Create(
                "Egyptian Onions", "بصل مصري", "ONION-EG", 0, 0,
                "Solid, high-quality Egyptian onions with a long shelf life and high durability under shipping conditions. Available in sizes to suit all needs.",
                "بصل مصري صلب وعالي الجودة بفترة تخزين طويلة وقدرة عالية على تحمل الشحن، متوفر بأحجام تناسب الاحتياجات.",
                ProductType.Vegetable, ProductState.Fresh, Season.Winter,
                ["Red Onion (أحمر)", "White Onion (أبيض)", "Spring Onion (أخضر)"],
                ["Mesh Bag", "Carton Box"],
                ["10 kg", "15 kg", "25 kg"],
                ["40–60 mm", "60–80 mm"],
                ["Export Grade", "Local Grade"]),

            Product.Create(
                "Carrots", "جزر", "CARROT-EG", 0, 0,
                "Firm, sweet Egyptian carrots with vibrant orange colour. Rich in beta-carotene, professionally sorted and packed for export markets.",
                "جزر مصري متماسك وحلو بلون برتقالي زاهٍ، غني بالبيتا كاروتين، يُفرز ويُعبأ احترافياً لأسواق التصدير.",
                ProductType.Vegetable, ProductState.Fresh, Season.Winter,
                ["Nantes", "Chantenay"],
                ["Carton Box", "Mesh Bag"],
                ["5 kg", "10 kg"],
                ["150–250 g/root"],
                ["Class I", "Class II"]),

            Product.Create(
                "Beetroot", "بنجر", "BEETROOT-EG", 0, 0,
                "Deep-red Egyptian beetroot with a sweet, earthy flavour. Excellent for fresh consumption, juicing, and processing.",
                "بنجر مصري أحمر داكن بنكهة حلوة وترابية، ممتاز للاستهلاك الطازج والعصر والتصنيع.",
                ProductType.Vegetable, ProductState.Fresh, Season.Winter,
                ["Red Beetroot", "Golden Beetroot"],
                ["Carton Box", "Mesh Bag"],
                ["5 kg", "10 kg"],
                ["Small", "Medium", "Large"],
                ["A", "B"]),

            Product.Create(
                "Broad Beans (Fava)", "فول بلدي", "FAVA-EG", 0, 0,
                "Egyptian broad beans with a rich, nutty flavour. A staple crop exported to Arab markets and Europe.",
                "فول بلدي مصري بنكهة غنية وعميقة، محصول أساسي يُصدَّر للأسواق العربية وأوروبا.",
                ProductType.Vegetable, ProductState.Fresh, Season.Winter,
                ["Balady (بلدي)", "Giza 3"],
                ["Mesh Bag", "Carton Box"],
                ["5 kg", "10 kg"],
                ["Small", "Medium", "Large"],
                ["A", "B"]),

            Product.Create(
                "Broccoli", "بروكلي", "BROCCOLI-EG", 0, 0,
                "Fresh Egyptian broccoli with tight, dark-green florets. High in nutrients, packed in temperature-controlled conditions for export.",
                "بروكلي مصري طازج بقرنبيطات خضراء داكنة ومتماسكة، عالي القيمة الغذائية، يُعبأ في ظروف مبردة للتصدير.",
                ProductType.Vegetable, ProductState.Fresh, Season.Winter,
                ["Green Magic", "Marathon"],
                ["Carton Box"],
                ["5 kg", "6 kg"],
                ["Small", "Medium", "Large"],
                ["A", "B"]),

            Product.Create(
                "Red Cabbage", "كرنب أحمر", "REDCABBAGE-EG", 0, 0,
                "Firm Egyptian red cabbage with a deep purple-red colour and mild peppery taste. Excellent for salads and pickling.",
                "كرنب أحمر مصري متماسك بلون بنفسجي أحمر داكن وطعم خفيف حار، ممتاز للسلطات والتخليل.",
                ProductType.Vegetable, ProductState.Fresh, Season.Winter,
                ["Red Cabbage"],
                ["Carton Box", "Mesh Bag"],
                ["5 kg", "10 kg", "15 kg"],
                ["1–1.5 kg/head", "1.5–2 kg/head"],
                ["A", "B"]),

            Product.Create(
                "Iceberg Lettuce", "خس آيسبرج", "ICEBERG-EG", 0, 0,
                "Crisp, fresh iceberg lettuce with a mild flavour and high water content. Packed and cooled for maximum shelf life in export markets.",
                "خس آيسبرج طازج ومقرمش بنكهة خفيفة ومحتوى مائي مرتفع، يُعبأ ويُبرد لأطول مدة صلاحية في أسواق التصدير.",
                ProductType.Vegetable, ProductState.Fresh, Season.Winter,
                ["Iceberg"],
                ["Carton Box"],
                ["5 kg", "6 kg"],
                ["400–600 g/head"],
                ["A", "B"]),

            // ─── خضراوات صيفية ────────────────────────────────────────────────────────
            Product.Create(
                "Tomatoes", "طماطم", "TOMATO-EG", 0, 0,
                "Fresh Egyptian tomatoes with vibrant red colour and firm flesh. Available in round and cherry varieties packed for fresh markets.",
                "طماطم مصرية طازجة بلون أحمر زاهٍ ولب متماسك، متوفرة بأنواع مستديرة وشيري لأسواق الاستهلاك الطازج.",
                ProductType.Vegetable, ProductState.Fresh, Season.Summer,
                ["Round (مستدير)", "Plum (بلوم)", "Hybrid"],
                ["Open Top Carton Box", "Plastic Crate"],
                ["5 kg", "7 kg", "10 kg"],
                ["Small", "Medium", "Large"],
                ["A", "B"]),

            Product.Create(
                "Cherry Tomatoes", "طماطم شيري", "CHERRY-TOMATO-EG", 0, 0,
                "Sweet, bite-sized cherry tomatoes in red, yellow, and mixed varieties. Packed in punnets for premium retail and export.",
                "طماطم شيري حلوة بحجم القضمة بأصناف حمراء وصفراء ومختلطة، تُعبأ في بانيت لتجزئة فاخرة وتصدير.",
                ProductType.Vegetable, ProductState.Fresh, Season.Summer,
                ["Red Cherry", "Yellow Cherry", "Mixed Colours"],
                ["Punnet 250 g", "Punnet 500 g", "Carton Box"],
                ["3 kg", "5 kg"],
                ["20–25 mm", "25–35 mm"],
                ["A", "B"]),

            Product.Create(
                "Coloured Bell Peppers", "فلفل ألوان", "BELLPEPPER-EG", 0, 0,
                "Vibrant Egyptian bell peppers in red, yellow, and orange. Sweet flavour and firm texture, packed for fresh markets and food service.",
                "فلفل ألوان مصري زاهي بأحمر وأصفر وبرتقالي، بنكهة حلوة وملمس متماسك، يُعبأ لأسواق الطازج والخدمات الغذائية.",
                ProductType.Vegetable, ProductState.Fresh, Season.Summer,
                ["Red Bell Pepper (أحمر)", "Yellow Bell Pepper (أصفر)", "Orange Bell Pepper (برتقالي)", "Green Bell Pepper (أخضر)"],
                ["Open Top Carton Box", "Punnet"],
                ["4 kg", "5 kg"],
                ["Small", "Medium", "Large"],
                ["A", "B"]),

            Product.Create(
                "Hot Peppers", "فلفل حار", "HOTPEPPER-EG", 0, 0,
                "Fresh Egyptian hot peppers with a consistent heat level. Available in green and red, exported to European and Gulf markets.",
                "فلفل حار مصري طازج بمستوى حرارة متسق، متوفر بأخضر وأحمر، يُصدَّر للأسواق الأوروبية والخليجية.",
                ProductType.Vegetable, ProductState.Fresh, Season.Summer,
                ["Jalapeno", "Balady Green (بلدي أخضر)", "Balady Red (بلدي أحمر)"],
                ["Open Top Carton Box", "Carton Box"],
                ["3 kg", "5 kg"],
                ["Small", "Medium"],
                ["A", "B"]),

            Product.Create(
                "Eggplant (Aubergine)", "باذنجان", "EGGPLANT-EG", 0, 0,
                "Fresh Egyptian eggplant with glossy skin and firm flesh. Available in black and white varieties for fresh consumption and processing.",
                "باذنجان مصري طازج بجلد لامع ولب متماسك، متوفر بأصناف أسود وأبيض للاستهلاك الطازج والتصنيع.",
                ProductType.Vegetable, ProductState.Fresh, Season.Summer,
                ["Black Eggplant (أسود)", "White Eggplant (أبيض)"],
                ["Open Top Carton Box"],
                ["5 kg", "7 kg"],
                ["100–200 g/fruit", "200–300 g/fruit"],
                ["A", "B"]),

            Product.Create(
                "Green Beans (French Beans)", "فاصوليا خضراء", "GREENBEANS-EG", 0, 0,
                "Crisp Egyptian green beans with a tender texture. A popular export crop to European markets, packed fresh for year-round supply.",
                "فاصوليا خضراء مصرية مقرمشة وطرية القوام، محصول تصديري شائع للأسواق الأوروبية، يُعبأ طازجاً.",
                ProductType.Vegetable, ProductState.Fresh, Season.Summer,
                ["Bobby (بوبي)", "Flat (فلات)"],
                ["Carton Box"],
                ["3 kg", "5 kg"],
                ["Fine (7–9 mm)", "Extra Fine (< 7 mm)"],
                ["Extra", "Class I"]),

            // ─── خضراوات طول العام ────────────────────────────────────────────────────
            Product.Create(
                "Sweet Potato", "بطاطا حلوة", "SWEETPOTATO-EG", 0, 0,
                "Sweet, nutritious Egyptian sweet potato with orange flesh and high beta-carotene content. Growing demand in European health-food markets.",
                "بطاطا حلوة مصرية بلب برتقالي وغنية بالبيتا كاروتين، طلب متنامٍ في أسواق الغذاء الصحي الأوروبية.",
                ProductType.Vegetable, ProductState.Fresh, Season.AllYear,
                ["Beauregard", "Georgia Jet"],
                ["Mesh Bag", "Carton Box"],
                ["5 kg", "10 kg", "15 kg"],
                ["Small", "Medium", "Large"],
                ["A", "B"]),

            Product.Create(
                "Pumpkin / Squash", "قرع عسلي", "PUMPKIN-EG", 0, 0,
                "Fresh Egyptian pumpkin and butternut squash with firm orange flesh and excellent shelf life. Used in soups, purees, and fresh consumption.",
                "قرع عسلي مصري طازج بلب برتقالي متماسك وصلاحية ممتازة، يُستخدم في الشوربات والهريس والاستهلاك الطازج.",
                ProductType.Vegetable, ProductState.Fresh, Season.AllYear,
                ["Butternut Squash", "Spaghetti Squash", "Pumpkin (بلدي)"],
                ["Carton Box", "Pallet (Loose)"],
                ["5 kg", "10 kg"],
                ["1–2 kg/fruit", "2–4 kg/fruit", "+4 kg/fruit"],
                ["A", "B"]),

            Product.Create(
                "Taro (Colcasia)", "قلقاس", "TARO-EG", 0, 0,
                "Egyptian taro root with a starchy, creamy texture. A staple in Egyptian and Arab cuisine, exported to Gulf and European Arab communities.",
                "قلقاس مصري بقوام نشوي وكريمي، من المحاصيل الأساسية في المطبخ المصري والعربي، يُصدَّر للخليج والجاليات العربية.",
                ProductType.Vegetable, ProductState.Fresh, Season.AllYear,
                ["Balady (بلدي)"],
                ["Mesh Bag", "Carton Box"],
                ["5 kg", "10 kg"],
                ["Small", "Medium", "Large"],
                ["A", "B"]),
        };

        foreach (var product in products)
        {
            await dbContext.AddProductAsync(product, CancellationToken.None);
        }

        await dbContext.SaveChangesAsync(CancellationToken.None);
    }

    private static Task EnsureProductImagesTableExistsAsync(AlatarDbContext dbContext)
    {
        const string sql = """
                           IF OBJECT_ID(N'[dbo].[ProductImages]', N'U') IS NULL
                           BEGIN
                               CREATE TABLE [dbo].[ProductImages]
                               (
                                   [Id] UNIQUEIDENTIFIER NOT NULL,
                                   [ProductId] UNIQUEIDENTIFIER NOT NULL,
                                   [RelativePath] NVARCHAR(500) NOT NULL,
                                   [DisplayOrder] INT NOT NULL CONSTRAINT [DF_ProductImages_DisplayOrder] DEFAULT 0,
                                   [CreatedAtUtc] DATETIME2 NOT NULL,
                                   CONSTRAINT [PK_ProductImages] PRIMARY KEY ([Id]),
                                   CONSTRAINT [FK_ProductImages_Products_ProductId]
                                       FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE CASCADE
                               );
                           END

                           IF NOT EXISTS (
                               SELECT 1
                               FROM sys.indexes
                               WHERE name = N'IX_ProductImages_ProductId'
                                   AND object_id = OBJECT_ID(N'[dbo].[ProductImages]')
                           )
                           BEGIN
                               CREATE INDEX [IX_ProductImages_ProductId]
                                   ON [dbo].[ProductImages]([ProductId]);
                           END
                           """;

        return dbContext.Database.ExecuteSqlRawAsync(sql);
    }
}

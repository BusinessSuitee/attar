using Alatar.Domain.Categories;

namespace Alatar.Domain.Products;

public sealed class Product
{
    private Product()
    {
    }

    private Product(
        Guid id,
        string name,
        string nameAr,
        string sku,
        decimal price,
        int stockQuantity,
        string descriptionEn,
        string descriptionAr,
        ProductType productType,
        ProductState productState,
        Season season,
        string varietiesJson,
        string packagingOptionsJson,
        string weightOptionsJson,
        string sizeOptionsJson,
        string gradeOptionsJson,
        string varietiesLocalizedJson,
        string packagingOptionsLocalizedJson,
        string weightOptionsLocalizedJson,
        string sizeOptionsLocalizedJson,
        string gradeOptionsLocalizedJson)
    {
        Id = id;
        Name = name;
        NameAr = nameAr;
        Sku = sku;
        Price = price;
        StockQuantity = stockQuantity;
        DescriptionEn = descriptionEn;
        DescriptionAr = descriptionAr;
        ProductType = productType;
        ProductState = productState;
        Season = season;
        VarietiesJson = varietiesJson;
        PackagingOptionsJson = packagingOptionsJson;
        WeightOptionsJson = weightOptionsJson;
        SizeOptionsJson = sizeOptionsJson;
        GradeOptionsJson = gradeOptionsJson;
        VarietiesLocalizedJson = varietiesLocalizedJson;
        PackagingOptionsLocalizedJson = packagingOptionsLocalizedJson;
        WeightOptionsLocalizedJson = weightOptionsLocalizedJson;
        SizeOptionsLocalizedJson = sizeOptionsLocalizedJson;
        GradeOptionsLocalizedJson = gradeOptionsLocalizedJson;
        Status = ProductStatus.Valid;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string NameAr { get; private set; } = string.Empty;
    public string Sku { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }
    public string DescriptionEn { get; private set; } = string.Empty;
    public string DescriptionAr { get; private set; } = string.Empty;
    public ProductType ProductType { get; private set; } = ProductType.Fruit;
    public ProductState ProductState { get; private set; } = ProductState.Fresh;
    public Season Season { get; private set; } = Season.AllYear;
    public string VarietiesJson { get; private set; } = "[]";
    public string PackagingOptionsJson { get; private set; } = "[]";
    public string WeightOptionsJson { get; private set; } = "[]";
    public string SizeOptionsJson { get; private set; } = "[]";
    public string GradeOptionsJson { get; private set; } = "[]";
    public string VarietiesLocalizedJson { get; private set; } = "[]";
    public string PackagingOptionsLocalizedJson { get; private set; } = "[]";
    public string WeightOptionsLocalizedJson { get; private set; } = "[]";
    public string SizeOptionsLocalizedJson { get; private set; } = "[]";
    public string GradeOptionsLocalizedJson { get; private set; } = "[]";
    public ProductStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public static Product Create(string name, string sku, decimal price, int openingStock)
    {
        return Create(
            name,
            string.Empty,
            sku,
            price,
            openingStock,
            string.Empty,
            string.Empty,
            ProductType.Fruit,
            ProductState.Fresh,
            Season.AllYear,
            [],
            [],
            [],
            [],
            []);
    }

    public static Product Create(
        string name,
        string nameAr,
        string sku,
        decimal price,
        int openingStock,
        string descriptionEn,
        string descriptionAr,
        ProductType productType,
        ProductState productState,
        Season season,
        IReadOnlyCollection<string> varieties,
        IReadOnlyCollection<string> packagingOptions,
        IReadOnlyCollection<string> weightOptions,
        IReadOnlyCollection<string> sizeOptions,
        IReadOnlyCollection<string> gradeOptions,
        IReadOnlyCollection<LocalizedProductOption>? varietiesLocalized = null,
        IReadOnlyCollection<LocalizedProductOption>? packagingOptionsLocalized = null,
        IReadOnlyCollection<LocalizedProductOption>? weightOptionsLocalized = null,
        IReadOnlyCollection<LocalizedProductOption>? sizeOptionsLocalized = null,
        IReadOnlyCollection<LocalizedProductOption>? gradeOptionsLocalized = null)
    {
        EnsureName(name);
        EnsureSku(sku);
        EnsurePrice(price);
        EnsureStock(openingStock);

        var normalizedVarietiesLocalized = ProductOptionJson.Normalize(varietiesLocalized, varieties, appendLegacyWhenLocalizedExists: false);
        var normalizedPackagingLocalized = ProductOptionJson.Normalize(packagingOptionsLocalized, packagingOptions, appendLegacyWhenLocalizedExists: false);
        var normalizedWeightLocalized = ProductOptionJson.Normalize(weightOptionsLocalized, weightOptions, appendLegacyWhenLocalizedExists: false);
        var normalizedSizeLocalized = ProductOptionJson.Normalize(sizeOptionsLocalized, sizeOptions, appendLegacyWhenLocalizedExists: false);
        var normalizedGradeLocalized = ProductOptionJson.Normalize(gradeOptionsLocalized, gradeOptions, appendLegacyWhenLocalizedExists: false);

        return new Product(
            Guid.NewGuid(),
            name.Trim(),
            nameAr.Trim(),
            sku.Trim().ToUpperInvariant(),
            decimal.Round(price, 2, MidpointRounding.AwayFromZero),
            openingStock,
            descriptionEn.Trim(),
            descriptionAr.Trim(),
            productType,
            productState,
            season,
            ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedVarietiesLocalized)),
            ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedPackagingLocalized)),
            ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedWeightLocalized)),
            ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedSizeLocalized)),
            ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedGradeLocalized)),
            ProductOptionJson.SerializeLocalized(normalizedVarietiesLocalized),
            ProductOptionJson.SerializeLocalized(normalizedPackagingLocalized),
            ProductOptionJson.SerializeLocalized(normalizedWeightLocalized),
            ProductOptionJson.SerializeLocalized(normalizedSizeLocalized),
            ProductOptionJson.SerializeLocalized(normalizedGradeLocalized));
    }

    public void Update(
        string name,
        string nameAr,
        decimal price,
        int stockQuantity,
        string descriptionEn,
        string descriptionAr,
        ProductType productType,
        ProductState productState,
        Season season,
        IReadOnlyCollection<string> varieties,
        IReadOnlyCollection<string> packagingOptions,
        IReadOnlyCollection<string> weightOptions,
        IReadOnlyCollection<string> sizeOptions,
        IReadOnlyCollection<string> gradeOptions,
        IReadOnlyCollection<LocalizedProductOption>? varietiesLocalized = null,
        IReadOnlyCollection<LocalizedProductOption>? packagingOptionsLocalized = null,
        IReadOnlyCollection<LocalizedProductOption>? weightOptionsLocalized = null,
        IReadOnlyCollection<LocalizedProductOption>? sizeOptionsLocalized = null,
        IReadOnlyCollection<LocalizedProductOption>? gradeOptionsLocalized = null)
    {
        EnsureName(name);
        EnsurePrice(price);
        EnsureStock(stockQuantity);

        var normalizedVarietiesLocalized = ProductOptionJson.Normalize(varietiesLocalized, varieties, appendLegacyWhenLocalizedExists: false);
        var normalizedPackagingLocalized = ProductOptionJson.Normalize(packagingOptionsLocalized, packagingOptions, appendLegacyWhenLocalizedExists: false);
        var normalizedWeightLocalized = ProductOptionJson.Normalize(weightOptionsLocalized, weightOptions, appendLegacyWhenLocalizedExists: false);
        var normalizedSizeLocalized = ProductOptionJson.Normalize(sizeOptionsLocalized, sizeOptions, appendLegacyWhenLocalizedExists: false);
        var normalizedGradeLocalized = ProductOptionJson.Normalize(gradeOptionsLocalized, gradeOptions, appendLegacyWhenLocalizedExists: false);

        Name = name.Trim();
        NameAr = nameAr.Trim();
        Price = decimal.Round(price, 2, MidpointRounding.AwayFromZero);
        StockQuantity = stockQuantity;
        DescriptionEn = descriptionEn.Trim();
        DescriptionAr = descriptionAr.Trim();
        ProductType = productType;
        ProductState = productState;
        Season = season;
        VarietiesJson = ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedVarietiesLocalized));
        PackagingOptionsJson = ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedPackagingLocalized));
        WeightOptionsJson = ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedWeightLocalized));
        SizeOptionsJson = ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedSizeLocalized));
        GradeOptionsJson = ProductOptionJson.SerializeLegacy(ProductOptionJson.ToLegacyValues(normalizedGradeLocalized));
        VarietiesLocalizedJson = ProductOptionJson.SerializeLocalized(normalizedVarietiesLocalized);
        PackagingOptionsLocalizedJson = ProductOptionJson.SerializeLocalized(normalizedPackagingLocalized);
        WeightOptionsLocalizedJson = ProductOptionJson.SerializeLocalized(normalizedWeightLocalized);
        SizeOptionsLocalizedJson = ProductOptionJson.SerializeLocalized(normalizedSizeLocalized);
        GradeOptionsLocalizedJson = ProductOptionJson.SerializeLocalized(normalizedGradeLocalized);
        Touch();
    }

    public void Rename(string name)
    {
        EnsureName(name);
        Name = name.Trim();
        Touch();
    }

    public void ChangePrice(decimal newPrice)
    {
        EnsurePrice(newPrice);
        Price = decimal.Round(newPrice, 2, MidpointRounding.AwayFromZero);
        Touch();
    }

    public void AddStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Stock delta must be greater than zero.");
        }

        StockQuantity += quantity;
        Touch();
    }

    public void RemoveStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Stock delta must be greater than zero.");
        }

        if (StockQuantity - quantity < 0)
        {
            throw new InvalidOperationException("Stock cannot be negative.");
        }

        StockQuantity -= quantity;
        Touch();
    }

    public void ChangeStatus(ProductStatus next)
    {
        if (!Enum.IsDefined(typeof(ProductStatus), next))
        {
            throw new ArgumentOutOfRangeException(nameof(next), "Unsupported product status.");
        }

        if (Status == next)
        {
            return;
        }

        Status = next;
        Touch();
    }

    private static void EnsureName(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length < 3)
        {
            throw new ArgumentException("Product name must be at least 3 characters.", nameof(name));
        }
    }

    private static void EnsureSku(string sku)
    {
        if (string.IsNullOrWhiteSpace(sku) || sku.Trim().Length < 3)
        {
            throw new ArgumentException("SKU must be at least 3 characters.", nameof(sku));
        }
    }

    private static void EnsurePrice(decimal price)
    {
        if (price < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(price), "Price cannot be negative.");
        }
    }

    private static void EnsureStock(int stock)
    {
        if (stock < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(stock), "Stock cannot be negative.");
        }
    }

    private void Touch()
    {
        UpdatedAtUtc = DateTime.UtcNow;
    }
}

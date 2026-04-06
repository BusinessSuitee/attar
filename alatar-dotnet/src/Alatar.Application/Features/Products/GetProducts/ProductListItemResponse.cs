namespace Alatar.Application.Features.Products.GetProducts;

public sealed record ProductImageItem(Guid Id, string Url);

public sealed record LocalizedProductOptionResponse(string Key, string LabelEn, string LabelAr);

public sealed record ProductListItemResponse(
    Guid Id,
    string Name,
    string NameAr,
    string Sku,
    decimal Price,
    int StockQuantity,
    string Status,
    string DescriptionEn,
    string DescriptionAr,
    string ProductType,
    string ProductState,
    string Season,
    IReadOnlyCollection<string> Varieties,
    IReadOnlyCollection<LocalizedProductOptionResponse> VarietiesLocalized,
    IReadOnlyCollection<string> PackagingOptions,
    IReadOnlyCollection<LocalizedProductOptionResponse> PackagingOptionsLocalized,
    IReadOnlyCollection<string> WeightOptions,
    IReadOnlyCollection<LocalizedProductOptionResponse> WeightOptionsLocalized,
    IReadOnlyCollection<string> SizeOptions,
    IReadOnlyCollection<LocalizedProductOptionResponse> SizeOptionsLocalized,
    IReadOnlyCollection<string> GradeOptions,
    IReadOnlyCollection<LocalizedProductOptionResponse> GradeOptionsLocalized,
    IReadOnlyCollection<string> ImageUrls,
    IReadOnlyCollection<ProductImageItem> Images);


namespace Alatar.Application.Features.Products.GetProducts;

public sealed record ProductImageItem(Guid Id, string Url);

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
    IReadOnlyCollection<string> PackagingOptions,
    IReadOnlyCollection<string> WeightOptions,
    IReadOnlyCollection<string> SizeOptions,
    IReadOnlyCollection<string> GradeOptions,
    IReadOnlyCollection<string> ImageUrls,
    IReadOnlyCollection<ProductImageItem> Images);


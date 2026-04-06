using Alatar.Domain.Categories;
using Alatar.Domain.Products;

namespace Alatar.Api.Contracts.Products;

public sealed record UpdateProductRequest(
    string Name,
    string NameAr,
    decimal Price,
    int StockQuantity,
    string DescriptionEn,
    string DescriptionAr,
    ProductType ProductType,
    ProductState ProductState,
    Season Season,
    IReadOnlyCollection<string>? Varieties,
    IReadOnlyCollection<LocalizedProductOptionRequest>? VarietiesLocalized,
    IReadOnlyCollection<string>? PackagingOptions,
    IReadOnlyCollection<LocalizedProductOptionRequest>? PackagingOptionsLocalized,
    IReadOnlyCollection<string>? WeightOptions,
    IReadOnlyCollection<LocalizedProductOptionRequest>? WeightOptionsLocalized,
    IReadOnlyCollection<string>? SizeOptions,
    IReadOnlyCollection<LocalizedProductOptionRequest>? SizeOptionsLocalized,
    IReadOnlyCollection<string>? GradeOptions,
    IReadOnlyCollection<LocalizedProductOptionRequest>? GradeOptionsLocalized);

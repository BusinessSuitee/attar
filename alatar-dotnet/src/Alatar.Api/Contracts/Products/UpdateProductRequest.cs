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
    IReadOnlyCollection<string>? PackagingOptions,
    IReadOnlyCollection<string>? WeightOptions,
    IReadOnlyCollection<string>? SizeOptions,
    IReadOnlyCollection<string>? GradeOptions);

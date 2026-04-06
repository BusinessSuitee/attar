using Alatar.Domain.Categories;
using Alatar.Domain.Products;

namespace Alatar.Api.Contracts.Products;

public sealed record CreateProductRequest(
    string Name,
    string NameAr,
    string Sku,
    decimal Price,
    int OpeningStock,
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

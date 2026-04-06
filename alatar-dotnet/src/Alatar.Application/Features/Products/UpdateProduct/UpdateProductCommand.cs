using Alatar.Application.Common.Results;
using Alatar.Domain.Categories;
using Alatar.Domain.Products;
using MediatR;

namespace Alatar.Application.Features.Products.UpdateProduct;

public sealed record UpdateProductCommand(
    Guid ProductId,
    string Name,
    string NameAr,
    decimal Price,
    int StockQuantity,
    string DescriptionEn,
    string DescriptionAr,
    ProductType ProductType,
    ProductState ProductState,
    Season Season,
    IReadOnlyCollection<string> Varieties,
    IReadOnlyCollection<LocalizedProductOption> VarietiesLocalized,
    IReadOnlyCollection<string> PackagingOptions,
    IReadOnlyCollection<LocalizedProductOption> PackagingOptionsLocalized,
    IReadOnlyCollection<string> WeightOptions,
    IReadOnlyCollection<LocalizedProductOption> WeightOptionsLocalized,
    IReadOnlyCollection<string> SizeOptions,
    IReadOnlyCollection<LocalizedProductOption> SizeOptionsLocalized,
    IReadOnlyCollection<string> GradeOptions,
    IReadOnlyCollection<LocalizedProductOption> GradeOptionsLocalized) : IRequest<Result<Guid>>;

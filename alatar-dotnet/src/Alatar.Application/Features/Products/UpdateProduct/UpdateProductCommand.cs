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
    IReadOnlyCollection<string> PackagingOptions,
    IReadOnlyCollection<string> WeightOptions,
    IReadOnlyCollection<string> SizeOptions,
    IReadOnlyCollection<string> GradeOptions) : IRequest<Result<Guid>>;

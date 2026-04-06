using Alatar.Application.Common.Results;
using Alatar.Domain.Categories;
using Alatar.Domain.Products;
using MediatR;

namespace Alatar.Application.Features.Products.AddProduct;

public sealed record AddProductCommand(
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
    IReadOnlyCollection<string> Varieties,
    IReadOnlyCollection<string> PackagingOptions,
    IReadOnlyCollection<string> WeightOptions,
    IReadOnlyCollection<string> SizeOptions,
    IReadOnlyCollection<string> GradeOptions) : IRequest<Result<Guid>>;

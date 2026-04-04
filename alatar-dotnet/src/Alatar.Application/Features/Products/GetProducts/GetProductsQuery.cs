using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Products.GetProducts;

public sealed record GetProductsQuery : IRequest<Result<IReadOnlyCollection<ProductListItemResponse>>>;

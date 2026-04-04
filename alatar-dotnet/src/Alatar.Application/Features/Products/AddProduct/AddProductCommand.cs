using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Products.AddProduct;

public sealed record AddProductCommand(
    string Name,
    string Sku,
    decimal Price,
    int OpeningStock) : IRequest<Result<Guid>>;
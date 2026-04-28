using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Products.DeleteProduct;

public sealed record DeleteProductCommand(Guid ProductId) : IRequest<Result>;

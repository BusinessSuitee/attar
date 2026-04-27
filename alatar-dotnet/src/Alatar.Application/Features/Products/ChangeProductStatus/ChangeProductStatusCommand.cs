using Alatar.Application.Common.Results;
using Alatar.Domain.Products;
using MediatR;

namespace Alatar.Application.Features.Products.ChangeProductStatus;

public sealed record ChangeProductStatusCommand(Guid ProductId, ProductStatus Status) : IRequest<Result<Guid>>;

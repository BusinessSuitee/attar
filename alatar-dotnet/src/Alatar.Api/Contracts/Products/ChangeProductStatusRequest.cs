using Alatar.Domain.Products;

namespace Alatar.Api.Contracts.Products;

public sealed record ChangeProductStatusRequest(ProductStatus Status);

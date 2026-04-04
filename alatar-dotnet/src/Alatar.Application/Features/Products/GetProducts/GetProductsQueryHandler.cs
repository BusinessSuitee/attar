using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Products.GetProducts;

public sealed class GetProductsQueryHandler(IProductRepository productRepository)
    : IRequestHandler<GetProductsQuery, Result<IReadOnlyCollection<ProductListItemResponse>>>
{
    public async Task<Result<IReadOnlyCollection<ProductListItemResponse>>> Handle(
        GetProductsQuery request,
        CancellationToken cancellationToken)
    {
        var products = await productRepository.ListAsync(cancellationToken);

        IReadOnlyCollection<ProductListItemResponse> response = products
            .Select(product => new ProductListItemResponse(
                product.Id,
                product.Name,
                product.Sku,
                product.Price,
                product.StockQuantity,
                product.Status.ToString()))
            .ToArray();

        return Result.Success(response);
    }
}

using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Products.DeleteProduct;

public sealed class DeleteProductCommandHandler(IProductRepository productRepository)
    : IRequestHandler<DeleteProductCommand, Result>
{
    public async Task<Result> Handle(DeleteProductCommand command, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdAsync(command.ProductId, cancellationToken);

        if (product is null)
        {
            return Result.Failure(Error.NotFound(
                "Products.NotFound",
                $"Product with id '{command.ProductId}' was not found."));
        }

        if (await productRepository.HasOrderRequestsAsync(command.ProductId, cancellationToken))
        {
            return Result.Failure(Error.Conflict(
                "Products.DeleteBlockedByOrders",
                "This product cannot be deleted because order requests still reference it."));
        }

        await productRepository.RemoveAsync(product, cancellationToken);

        return Result.Success();
    }
}

using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Products.ChangeProductStatus;

public sealed class ChangeProductStatusCommandHandler(IProductRepository productRepository)
    : IRequestHandler<ChangeProductStatusCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(ChangeProductStatusCommand command, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdTrackedAsync(command.ProductId, cancellationToken);

        if (product is null)
        {
            return Result.Failure<Guid>(Error.NotFound(
                "Products.NotFound",
                $"Product with id '{command.ProductId}' was not found."));
        }

        product.ChangeStatus(command.Status);
        await productRepository.UpdateAsync(product, cancellationToken);

        return Result.Success(product.Id);
    }
}

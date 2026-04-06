using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Products.UpdateProduct;

public sealed class UpdateProductCommandHandler(IProductRepository productRepository)
    : IRequestHandler<UpdateProductCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(UpdateProductCommand command, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdTrackedAsync(command.ProductId, cancellationToken);

        if (product is null)
        {
            return Result.Failure<Guid>(Error.NotFound(
                "Products.NotFound",
                $"Product with id '{command.ProductId}' was not found."));
        }

        product.Update(
            command.Name,
            command.NameAr,
            command.Price,
            command.StockQuantity,
            command.DescriptionEn,
            command.DescriptionAr,
            command.ProductType,
            command.ProductState,
            command.Season,
            command.Varieties,
            command.PackagingOptions,
            command.WeightOptions,
            command.SizeOptions,
            command.GradeOptions,
            command.VarietiesLocalized,
            command.PackagingOptionsLocalized,
            command.WeightOptionsLocalized,
            command.SizeOptionsLocalized,
            command.GradeOptionsLocalized);

        await productRepository.UpdateAsync(product, cancellationToken);

        return Result.Success(product.Id);
    }
}

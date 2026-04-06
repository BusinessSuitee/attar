using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using Alatar.Domain.Products;
using MediatR;

namespace Alatar.Application.Features.Products.AddProduct;

public sealed class AddProductCommandHandler(IProductRepository productRepository)
    : IRequestHandler<AddProductCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddProductCommand command, CancellationToken cancellationToken)
    {
        var normalizedSku = command.Sku.Trim().ToUpperInvariant();

        if (await productRepository.ExistsBySkuAsync(normalizedSku, cancellationToken))
        {
            return Result.Failure<Guid>(Error.Conflict(
                "Products.SkuAlreadyExists",
                $"Product with sku '{normalizedSku}' already exists."));
        }

        var product = Product.Create(
            command.Name,
            command.NameAr,
            normalizedSku,
            command.Price,
            command.OpeningStock,
            command.DescriptionEn,
            command.DescriptionAr,
            command.ProductType,
            command.ProductState,
            command.Season,
            command.Varieties,
            command.PackagingOptions,
            command.WeightOptions,
            command.SizeOptions,
            command.GradeOptions);

        await productRepository.AddAsync(product, cancellationToken);

        return Result.Success(product.Id);
    }
}

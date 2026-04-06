using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;
using System.Text.Json;

namespace Alatar.Application.Features.Products.GetProducts;

public sealed class GetProductsQueryHandler(IProductRepository productRepository)
    : IRequestHandler<GetProductsQuery, Result<IReadOnlyCollection<ProductListItemResponse>>>
{
    public async Task<Result<IReadOnlyCollection<ProductListItemResponse>>> Handle(
        GetProductsQuery request,
        CancellationToken cancellationToken)
    {
        var products = await productRepository.ListAsync(cancellationToken);
        var imageUrlsByProductId = new Dictionary<Guid, IReadOnlyCollection<string>>();
        var imagesByProductId = new Dictionary<Guid, IReadOnlyCollection<ProductImageItem>>();

        foreach (var product in products)
        {
            var images = await productRepository.ListImagesAsync(product.Id, cancellationToken);
            imageUrlsByProductId[product.Id] = images
                .Select(image => image.RelativePath.StartsWith('/')
                    ? image.RelativePath
                    : "/" + image.RelativePath)
                .ToArray();
            imagesByProductId[product.Id] = images
                .Select(image => new ProductImageItem(
                    image.Id,
                    image.RelativePath.StartsWith('/') ? image.RelativePath : "/" + image.RelativePath))
                .ToArray();
        }

        IReadOnlyCollection<ProductListItemResponse> response = products
            .Select(product => new ProductListItemResponse(
                product.Id,
                product.Name,
                product.NameAr,
                product.Sku,
                product.Price,
                product.StockQuantity,
                product.Status.ToString(),
                product.DescriptionEn,
                product.DescriptionAr,
                product.ProductType.ToString(),
                product.ProductState.ToString(),
                product.Season.ToString(),
                DeserializeJsonArray(product.VarietiesJson),
                DeserializeJsonArray(product.PackagingOptionsJson),
                DeserializeJsonArray(product.WeightOptionsJson),
                DeserializeJsonArray(product.SizeOptionsJson),
                DeserializeJsonArray(product.GradeOptionsJson),
                imageUrlsByProductId.GetValueOrDefault(product.Id, []),
                imagesByProductId.GetValueOrDefault(product.Id, [])))
            .ToArray();

        return Result.Success(response);
    }

    private static IReadOnlyCollection<string> DeserializeJsonArray(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<string[]>(value) ?? [];
        }
        catch
        {
            return [];
        }
    }
}

using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using Alatar.Domain.Products;
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
            .Select(product =>
            {
                var varieties = ResolveOptions(product.VarietiesJson, product.VarietiesLocalizedJson);
                var packaging = ResolveOptions(product.PackagingOptionsJson, product.PackagingOptionsLocalizedJson);
                var weight = ResolveOptions(product.WeightOptionsJson, product.WeightOptionsLocalizedJson);
                var size = ResolveOptions(product.SizeOptionsJson, product.SizeOptionsLocalizedJson);
                var grade = ResolveOptions(product.GradeOptionsJson, product.GradeOptionsLocalizedJson);

                return new ProductListItemResponse(
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
                    varieties.Legacy,
                    varieties.Localized,
                    packaging.Legacy,
                    packaging.Localized,
                    weight.Legacy,
                    weight.Localized,
                    size.Legacy,
                    size.Localized,
                    grade.Legacy,
                    grade.Localized,
                    imageUrlsByProductId.GetValueOrDefault(product.Id, []),
                    imagesByProductId.GetValueOrDefault(product.Id, []));
            })
            .ToArray();

        return Result.Success(response);
    }

    private static (IReadOnlyCollection<string> Legacy, IReadOnlyCollection<LocalizedProductOptionResponse> Localized)
        ResolveOptions(string? legacyJson, string? localizedJson)
    {
        var legacy = ProductOptionJson.DeserializeLegacy(legacyJson);
        var normalizedLocalized = ProductOptionJson.Normalize(
            ProductOptionJson.DeserializeLocalized(localizedJson),
            legacy,
            appendLegacyWhenLocalizedExists: false);

        var normalizedLegacy = ProductOptionJson.ToLegacyValues(normalizedLocalized);
        var localized = normalizedLocalized
            .Select(option => new LocalizedProductOptionResponse(option.Key, option.LabelEn, option.LabelAr))
            .ToArray();

        return (normalizedLegacy, localized);
    }
}

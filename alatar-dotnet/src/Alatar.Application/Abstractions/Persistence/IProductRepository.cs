using Alatar.Domain.Products;

namespace Alatar.Application.Abstractions.Persistence;

public interface IProductRepository : IGeneralRepository<Product, Guid>
{
    Task<bool> ExistsBySkuAsync(string sku, CancellationToken cancellationToken);
    Task<Product?> GetByIdTrackedAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<ProductImage>> ListImagesAsync(Guid productId, CancellationToken cancellationToken);
    Task<ProductImage?> GetImageByIdAsync(Guid imageId, CancellationToken cancellationToken);
    Task AddImageAsync(ProductImage image, CancellationToken cancellationToken);
    Task RemoveImageAsync(ProductImage image, CancellationToken cancellationToken);
}

using Alatar.Domain.Products;

namespace Alatar.Application.Abstractions.Persistence;

public interface IProductRepository : IGeneralRepository<Product, Guid>
{
    Task<bool> ExistsBySkuAsync(string sku, CancellationToken cancellationToken);
}
using Alatar.Application.Abstractions.Persistence;
using Alatar.Domain.Products;
using Microsoft.EntityFrameworkCore;

namespace Alatar.Infrastructure.Persistence;

public sealed class SqlProductRepository(IAlatarDbContext dbContext) : IProductRepository
{
    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(product => product.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Product>> ListAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Products
            .AsNoTracking()
            .OrderBy(product => product.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task AddAsync(Product entity, CancellationToken cancellationToken)
    {
        await dbContext.AddProductAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(Product entity, CancellationToken cancellationToken)
    {
        dbContext.RemoveProduct(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<bool> ExistsBySkuAsync(string sku, CancellationToken cancellationToken)
    {
        return dbContext.Products
            .AnyAsync(product => product.Sku == sku, cancellationToken);
    }
}

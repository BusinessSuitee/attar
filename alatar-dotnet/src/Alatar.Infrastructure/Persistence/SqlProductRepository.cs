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

    public async Task<Product?> GetByIdTrackedAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Products
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

    public async Task UpdateAsync(Product entity, CancellationToken cancellationToken)
    {
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

    public async Task<IReadOnlyCollection<ProductImage>> ListImagesAsync(Guid productId, CancellationToken cancellationToken)
    {
        return await dbContext.ProductImages
            .AsNoTracking()
            .Where(image => image.ProductId == productId)
            .OrderBy(image => image.DisplayOrder)
            .ThenBy(image => image.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<ProductImage?> GetImageByIdAsync(Guid imageId, CancellationToken cancellationToken)
    {
        return await dbContext.ProductImages
            .AsNoTracking()
            .FirstOrDefaultAsync(image => image.Id == imageId, cancellationToken);
    }

    public async Task AddImageAsync(ProductImage image, CancellationToken cancellationToken)
    {
        await dbContext.AddProductImageAsync(image, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveImageAsync(ProductImage image, CancellationToken cancellationToken)
    {
        dbContext.RemoveProductImage(image);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}

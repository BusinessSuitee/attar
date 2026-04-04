using Alatar.Application.Abstractions.Persistence;
using Alatar.Domain.Categories;
using Microsoft.EntityFrameworkCore;

namespace Alatar.Infrastructure.Persistence;

public sealed class SqlCategoryRepository(IAlatarDbContext dbContext) : ICategoryRepository
{
    public async Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(category => category.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Category>> ListAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Categories
            .AsNoTracking()
            .OrderBy(category => category.Name)
            .ToArrayAsync(cancellationToken);
    }

    public async Task AddAsync(Category entity, CancellationToken cancellationToken)
    {
        await dbContext.AddCategoryAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(Category entity, CancellationToken cancellationToken)
    {
        dbContext.RemoveCategory(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<bool> ExistsByNormalizedNameAsync(string normalizedName, CancellationToken cancellationToken)
    {
        return dbContext.Categories
            .AnyAsync(category => category.NormalizedName == normalizedName, cancellationToken);
    }
}

using Alatar.Application.Abstractions.Persistence;
using Alatar.Domain.SocialLinks;
using Microsoft.EntityFrameworkCore;

namespace Alatar.Infrastructure.Persistence;

public sealed class SqlSocialLinkRepository(IAlatarDbContext dbContext) : ISocialLinkRepository
{
    public async Task<SocialLink?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.SocialLinks
            .FirstOrDefaultAsync(link => link.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<SocialLink>> ListAsync(CancellationToken cancellationToken)
    {
        return await dbContext.SocialLinks
            .OrderBy(link => link.DisplayOrder)
            .ThenBy(link => link.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<SocialLink>> ListEnabledAsync(CancellationToken cancellationToken)
    {
        return await dbContext.SocialLinks
            .AsNoTracking()
            .Where(link => link.IsEnabled)
            .OrderBy(link => link.DisplayOrder)
            .ThenBy(link => link.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<int> GetMaxDisplayOrderAsync(CancellationToken cancellationToken)
    {
        if (!await dbContext.SocialLinks.AnyAsync(cancellationToken))
        {
            return -1;
        }

        return await dbContext.SocialLinks.MaxAsync(link => link.DisplayOrder, cancellationToken);
    }

    public async Task AddAsync(SocialLink entity, CancellationToken cancellationToken)
    {
        await dbContext.AddSocialLinkAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(SocialLink entity, CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(SocialLink entity, CancellationToken cancellationToken)
    {
        dbContext.RemoveSocialLink(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}

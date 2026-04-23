using Alatar.Domain.SocialLinks;

namespace Alatar.Application.Abstractions.Persistence;

public interface ISocialLinkRepository : IGeneralRepository<SocialLink, Guid>
{
    Task<IReadOnlyCollection<SocialLink>> ListEnabledAsync(CancellationToken cancellationToken);
    Task<int> GetMaxDisplayOrderAsync(CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

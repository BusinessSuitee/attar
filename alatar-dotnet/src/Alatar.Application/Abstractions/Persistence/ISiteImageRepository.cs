using Alatar.Domain.SiteImages;

namespace Alatar.Application.Abstractions.Persistence;

public interface ISiteImageRepository
{
    Task<SiteImage?> FindAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<SiteImage>> ListAsync(CancellationToken cancellationToken);
    Task AddAsync(SiteImage image, CancellationToken cancellationToken);
    Task RemoveAsync(SiteImage image, CancellationToken cancellationToken);
    Task SaveAsync(CancellationToken cancellationToken);
    Task<bool> IsUploadReferencedAsync(string path, CancellationToken cancellationToken);
}

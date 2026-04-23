using Microsoft.AspNetCore.Http;

namespace Alatar.Api.Storage;

public interface ISocialIconStorage
{
    Task<string> SaveAsync(Guid socialLinkId, IFormFile file, CancellationToken cancellationToken);
    Task DeleteAsync(string relativePath, CancellationToken cancellationToken);
}

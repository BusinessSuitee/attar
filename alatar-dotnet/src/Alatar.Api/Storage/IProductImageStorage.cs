using Microsoft.AspNetCore.Http;

namespace Alatar.Api.Storage;

public interface IProductImageStorage
{
    Task<string> SaveAsync(Guid productId, IFormFile file, CancellationToken cancellationToken);
    Task DeleteAsync(string relativePath, CancellationToken cancellationToken);
}

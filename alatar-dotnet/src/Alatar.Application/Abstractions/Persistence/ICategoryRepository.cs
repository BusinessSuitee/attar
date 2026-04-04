using Alatar.Domain.Categories;

namespace Alatar.Application.Abstractions.Persistence;

public interface ICategoryRepository : IGeneralRepository<Category, Guid>
{
    Task<bool> ExistsByNormalizedNameAsync(string normalizedName, CancellationToken cancellationToken);
}

namespace Alatar.Application.Abstractions.Persistence;

public interface IGeneralRepository<TEntity, in TKey>
    where TEntity : class
{
    Task<TEntity?> GetByIdAsync(TKey id, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<TEntity>> ListAsync(CancellationToken cancellationToken);
    Task AddAsync(TEntity entity, CancellationToken cancellationToken);
    Task UpdateAsync(TEntity entity, CancellationToken cancellationToken);
    Task RemoveAsync(TEntity entity, CancellationToken cancellationToken);
}

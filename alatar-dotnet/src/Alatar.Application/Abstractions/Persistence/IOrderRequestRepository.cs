using Alatar.Domain.OrderRequests;

namespace Alatar.Application.Abstractions.Persistence;

public interface IOrderRequestRepository : IGeneralRepository<OrderRequest, Guid>
{
    Task<(IReadOnlyCollection<OrderRequest> Items, int TotalCount)> ListPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<bool> UpdateStatusAsync(
        Guid id,
        OrderRequestStatus status,
        CancellationToken cancellationToken);

    Task<bool> SoftDeleteAsync(
        Guid id,
        CancellationToken cancellationToken);
}

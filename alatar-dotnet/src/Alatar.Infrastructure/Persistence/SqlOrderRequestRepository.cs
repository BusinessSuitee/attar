using Alatar.Application.Abstractions.Persistence;
using Alatar.Domain.OrderRequests;
using Microsoft.EntityFrameworkCore;

namespace Alatar.Infrastructure.Persistence;

public sealed class SqlOrderRequestRepository(IAlatarDbContext dbContext) : IOrderRequestRepository
{
    public async Task<OrderRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.OrderRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(
                orderRequest => orderRequest.Id == id && !orderRequest.IsDeleted,
                cancellationToken);
    }

    public async Task<IReadOnlyCollection<OrderRequest>> ListAsync(CancellationToken cancellationToken)
    {
        return await dbContext.OrderRequests
            .AsNoTracking()
            .Where(orderRequest => !orderRequest.IsDeleted)
            .OrderByDescending(orderRequest => orderRequest.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<(IReadOnlyCollection<OrderRequest> Items, int TotalCount)> ListPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize < 1 ? 50 : pageSize;

        var requestsQuery = dbContext.OrderRequests
            .AsNoTracking()
            .Where(orderRequest => !orderRequest.IsDeleted);
        var totalCount = await requestsQuery.CountAsync(cancellationToken);

        var requests = await requestsQuery
            .OrderByDescending(orderRequest => orderRequest.CreatedAtUtc)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToArrayAsync(cancellationToken);

        return (requests, totalCount);
    }

    public async Task AddAsync(OrderRequest entity, CancellationToken cancellationToken)
    {
        await dbContext.AddOrderRequestAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(OrderRequest entity, CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(OrderRequest entity, CancellationToken cancellationToken)
    {
        var orderRequest = await dbContext.OrderRequests
            .FirstOrDefaultAsync(x => x.Id == entity.Id && !x.IsDeleted, cancellationToken);

        if (orderRequest is null)
        {
            return;
        }

        orderRequest.SoftDelete();
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> UpdateStatusAsync(
        Guid id,
        OrderRequestStatus status,
        CancellationToken cancellationToken)
    {
        var orderRequest = await dbContext.OrderRequests
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

        if (orderRequest is null)
        {
            return false;
        }

        orderRequest.SetStatus(status);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SoftDeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var orderRequest = await dbContext.OrderRequests
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

        if (orderRequest is null)
        {
            return false;
        }

        orderRequest.SoftDelete();
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}

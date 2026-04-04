using Alatar.Domain.Contacts;

namespace Alatar.Application.Abstractions.Persistence;

public interface IContactRepository : IGeneralRepository<ContactLead, Guid>
{
    Task<(IReadOnlyCollection<ContactLead> Items, int TotalCount)> ListPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<bool> UpdateStatusAsync(
        Guid id,
        ContactLeadStatus status,
        CancellationToken cancellationToken);
}

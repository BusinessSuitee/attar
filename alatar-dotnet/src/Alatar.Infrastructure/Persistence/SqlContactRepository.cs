using Alatar.Application.Abstractions.Persistence;
using Alatar.Domain.Contacts;
using Microsoft.EntityFrameworkCore;

namespace Alatar.Infrastructure.Persistence;

public sealed class SqlContactRepository(IAlatarDbContext dbContext) : IContactRepository
{
    public async Task<ContactLead?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Contacts
            .AsNoTracking()
            .FirstOrDefaultAsync(contact => contact.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<ContactLead>> ListAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Contacts
            .AsNoTracking()
            .OrderByDescending(contact => contact.CreatedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<(IReadOnlyCollection<ContactLead> Items, int TotalCount)> ListPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize < 1 ? 50 : pageSize;

        var contactsQuery = dbContext.Contacts.AsNoTracking();
        var totalCount = await contactsQuery.CountAsync(cancellationToken);

        var contacts = await contactsQuery
            .OrderByDescending(contact => contact.CreatedAtUtc)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToArrayAsync(cancellationToken);

        return (contacts, totalCount);
    }

    public async Task AddAsync(ContactLead entity, CancellationToken cancellationToken)
    {
        await dbContext.AddContactAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(ContactLead entity, CancellationToken cancellationToken)
    {
        dbContext.RemoveContact(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> UpdateStatusAsync(Guid id, ContactLeadStatus status, CancellationToken cancellationToken)
    {
        var contact = await dbContext.Contacts
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (contact is null)
        {
            return false;
        }

        contact.SetStatus(status);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}

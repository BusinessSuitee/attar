namespace Alatar.Application.Features.Contacts.GetContacts;

public sealed record GetContactsResponse(
    IReadOnlyCollection<ContactListItemResponse> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);

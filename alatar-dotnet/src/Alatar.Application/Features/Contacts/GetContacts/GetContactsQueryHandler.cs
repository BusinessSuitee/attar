using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Contacts.GetContacts;

public sealed class GetContactsQueryHandler(IContactRepository contactRepository)
    : IRequestHandler<GetContactsQuery, Result<GetContactsResponse>>
{
    public async Task<Result<GetContactsResponse>> Handle(
        GetContactsQuery request,
        CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize switch
        {
            < 1 => 50,
            > 100 => 100,
            _ => request.PageSize
        };

        var (contacts, totalCount) = await contactRepository.ListPagedAsync(
            page,
            pageSize,
            cancellationToken);

        IReadOnlyCollection<ContactListItemResponse> response = contacts
            .Select(contact => new ContactListItemResponse(
                contact.Id,
                contact.FullName,
                contact.PhoneNumber,
                contact.ServiceType.ToString(),
                contact.Status.ToString(),
                contact.CompanyName,
                contact.Country,
                contact.Crop,
                contact.QuantityTons,
                contact.DeliveryWindow,
                contact.Notes,
                contact.CreatedAtUtc))
            .ToArray();

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)pageSize);

        return Result.Success(new GetContactsResponse(
            response,
            totalCount,
            page,
            pageSize,
            totalPages));
    }
}

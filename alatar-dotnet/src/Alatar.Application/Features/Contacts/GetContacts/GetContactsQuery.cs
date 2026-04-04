using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Contacts.GetContacts;

public sealed record GetContactsQuery(
    int Page,
    int PageSize) : IRequest<Result<GetContactsResponse>>;

using Alatar.Application.Common.Results;
using Alatar.Domain.Contacts;
using MediatR;

namespace Alatar.Application.Features.Contacts.UpdateContactStatus;

public sealed record UpdateContactStatusCommand(
    Guid ContactId,
    ContactLeadStatus Status) : IRequest<Result>;

using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Contacts.DeleteContact;

public sealed record DeleteContactCommand(Guid ContactId) : IRequest<Result>;

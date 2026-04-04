using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using Alatar.Domain.Contacts;
using MediatR;

namespace Alatar.Application.Features.Contacts.AddContact;

public sealed class AddContactCommandHandler(IContactRepository contactRepository)
    : IRequestHandler<AddContactCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddContactCommand command, CancellationToken cancellationToken)
    {
        var contactLead = ContactLead.Create(
            command.FullName,
            command.PhoneNumber,
            command.ServiceType,
            command.CompanyName,
            command.Country,
            command.Crop,
            command.QuantityTons,
            command.DeliveryWindow,
            command.Notes);

        await contactRepository.AddAsync(contactLead, cancellationToken);

        return Result.Success(contactLead.Id);
    }
}

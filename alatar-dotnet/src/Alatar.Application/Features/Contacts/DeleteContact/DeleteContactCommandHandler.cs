using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Contacts.DeleteContact;

public sealed class DeleteContactCommandHandler(IContactRepository contactRepository)
    : IRequestHandler<DeleteContactCommand, Result>
{
    public async Task<Result> Handle(DeleteContactCommand command, CancellationToken cancellationToken)
    {
        var contact = await contactRepository.GetByIdAsync(command.ContactId, cancellationToken);

        if (contact is null)
        {
            return Result.Failure(Error.NotFound(
                "Contacts.NotFound",
                $"Contact with id '{command.ContactId}' was not found."));
        }

        await contactRepository.RemoveAsync(contact, cancellationToken);
        return Result.Success();
    }
}

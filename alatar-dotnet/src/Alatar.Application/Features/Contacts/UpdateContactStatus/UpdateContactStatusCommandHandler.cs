using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Contacts.UpdateContactStatus;

public sealed class UpdateContactStatusCommandHandler(IContactRepository contactRepository)
    : IRequestHandler<UpdateContactStatusCommand, Result>
{
    public async Task<Result> Handle(UpdateContactStatusCommand command, CancellationToken cancellationToken)
    {
        var updated = await contactRepository.UpdateStatusAsync(
            command.ContactId,
            command.Status,
            cancellationToken);

        if (!updated)
        {
            return Result.Failure(Error.NotFound(
                "Contacts.NotFound",
                $"Contact with id '{command.ContactId}' was not found."));
        }

        return Result.Success();
    }
}

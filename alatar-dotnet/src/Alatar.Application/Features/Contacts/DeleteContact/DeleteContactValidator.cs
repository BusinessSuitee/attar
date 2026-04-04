using FluentValidation;

namespace Alatar.Application.Features.Contacts.DeleteContact;

public sealed class DeleteContactValidator : AbstractValidator<DeleteContactCommand>
{
    public DeleteContactValidator()
    {
        RuleFor(command => command.ContactId)
            .NotEmpty();
    }
}

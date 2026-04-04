using FluentValidation;

namespace Alatar.Application.Features.Contacts.UpdateContactStatus;

public sealed class UpdateContactStatusValidator : AbstractValidator<UpdateContactStatusCommand>
{
    public UpdateContactStatusValidator()
    {
        RuleFor(command => command.ContactId)
            .NotEmpty();

        RuleFor(command => command.Status)
            .IsInEnum();
    }
}

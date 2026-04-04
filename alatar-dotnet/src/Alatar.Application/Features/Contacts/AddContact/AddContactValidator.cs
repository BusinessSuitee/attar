using Alatar.Domain.Contacts;
using FluentValidation;

namespace Alatar.Application.Features.Contacts.AddContact;

public sealed class AddContactValidator : AbstractValidator<AddContactCommand>
{
    public AddContactValidator()
    {
        RuleFor(command => command.FullName)
            .NotEmpty()
            .MinimumLength(3);

        RuleFor(command => command.PhoneNumber)
            .NotEmpty()
            .MinimumLength(7);

        RuleFor(command => command.ServiceType)
            .IsInEnum();

        RuleFor(command => command.Country)
            .NotEmpty()
            .When(command => command.ServiceType == ContactServiceType.Export)
            .WithMessage("Country is required for export requests.");

        RuleFor(command => command.QuantityTons)
            .GreaterThanOrEqualTo(0)
            .When(command => command.QuantityTons.HasValue);
    }
}

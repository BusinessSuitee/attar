using FluentValidation;

namespace Alatar.Application.Features.OrderRequests.AddOrderRequest;

public sealed class AddOrderRequestValidator : AbstractValidator<AddOrderRequestCommand>
{
    public AddOrderRequestValidator()
    {
        RuleFor(command => command.ProductId)
            .NotEmpty();

        RuleFor(command => command.RequesterName)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(200);

        RuleFor(command => command.PhoneNumber)
            .NotEmpty()
            .MinimumLength(7)
            .MaximumLength(64);

        RuleFor(command => command.QuantityTons)
            .GreaterThan(0);

        RuleFor(command => command.SelectedVariety)
            .MaximumLength(120)
            .When(command => !string.IsNullOrWhiteSpace(command.SelectedVariety));

        RuleFor(command => command.SelectedPackaging)
            .MaximumLength(120)
            .When(command => !string.IsNullOrWhiteSpace(command.SelectedPackaging));

        RuleFor(command => command.SelectedWeight)
            .MaximumLength(120)
            .When(command => !string.IsNullOrWhiteSpace(command.SelectedWeight));

        RuleFor(command => command.SelectedSize)
            .MaximumLength(120)
            .When(command => !string.IsNullOrWhiteSpace(command.SelectedSize));

        RuleFor(command => command.SelectedGrade)
            .MaximumLength(120)
            .When(command => !string.IsNullOrWhiteSpace(command.SelectedGrade));
    }
}

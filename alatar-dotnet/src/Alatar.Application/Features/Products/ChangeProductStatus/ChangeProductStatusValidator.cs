using FluentValidation;

namespace Alatar.Application.Features.Products.ChangeProductStatus;

public sealed class ChangeProductStatusValidator : AbstractValidator<ChangeProductStatusCommand>
{
    public ChangeProductStatusValidator()
    {
        RuleFor(command => command.ProductId)
            .NotEmpty();

        RuleFor(command => command.Status)
            .IsInEnum();
    }
}

using FluentValidation;

namespace Alatar.Application.Features.Products.AddProduct;

public sealed class AddProductValidator : AbstractValidator<AddProductCommand>
{
    public AddProductValidator()
    {
        RuleFor(command => command.Name)
            .NotEmpty()
            .MinimumLength(3);

        RuleFor(command => command.Sku)
            .NotEmpty()
            .MinimumLength(3);

        RuleFor(command => command.Price)
            .GreaterThan(0);

        RuleFor(command => command.OpeningStock)
            .GreaterThanOrEqualTo(0);
    }
}
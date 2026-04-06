using FluentValidation;

namespace Alatar.Application.Features.Products.AddProduct;

public sealed class AddProductValidator : AbstractValidator<AddProductCommand>
{
    public AddProductValidator()
    {
        RuleFor(command => command.Name)
            .NotEmpty()
            .MinimumLength(3);

        RuleFor(command => command.NameAr)
            .NotEmpty()
            .MinimumLength(2);

        RuleFor(command => command.Sku)
            .NotEmpty()
            .MinimumLength(3);

        RuleFor(command => command.Price)
            .GreaterThanOrEqualTo(0);

        RuleFor(command => command.OpeningStock)
            .GreaterThanOrEqualTo(0);

        RuleFor(command => command.ProductType)
            .IsInEnum();

        RuleFor(command => command.ProductState)
            .IsInEnum();

        RuleFor(command => command.Season)
            .IsInEnum();

        RuleForEach(command => command.Varieties)
            .NotEmpty()
            .MaximumLength(100);

        RuleForEach(command => command.PackagingOptions)
            .NotEmpty()
            .MaximumLength(120);

        RuleForEach(command => command.WeightOptions)
            .NotEmpty()
            .MaximumLength(80);

        RuleForEach(command => command.SizeOptions)
            .NotEmpty()
            .MaximumLength(80);

        RuleForEach(command => command.GradeOptions)
            .NotEmpty()
            .MaximumLength(80);
    }
}

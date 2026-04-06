using FluentValidation;

namespace Alatar.Application.Features.Categories.AddCategory;

public sealed class AddCategoryValidator : AbstractValidator<AddCategoryCommand>
{
    public AddCategoryValidator()
    {
        RuleFor(command => command.Name)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(120);

        RuleFor(command => command.Type)
            .NotEmpty();

        RuleFor(command => command.Season)
            .NotEmpty();
    }
}

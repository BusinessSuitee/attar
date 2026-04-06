using FluentValidation;

namespace Alatar.Application.Features.Categories.UpdateCategory;

public sealed class UpdateCategoryValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty();

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

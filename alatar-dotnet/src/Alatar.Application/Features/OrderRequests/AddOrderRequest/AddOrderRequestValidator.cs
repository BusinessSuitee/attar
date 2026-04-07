using FluentValidation;

namespace Alatar.Application.Features.OrderRequests.AddOrderRequest;

public sealed class AddOrderRequestValidator : AbstractValidator<AddOrderRequestCommand>
{
    private const int MaxSelectionItems = 30;

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

        RuleFor(command => command.SelectedVarieties)
            .Must(HaveNoDuplicateValues)
            .WithMessage("selected varieties contain duplicate values.")
            .Must(HaveAllowedCount)
            .WithMessage($"selected varieties exceed the maximum allowed selections ({MaxSelectionItems}).");

        RuleForEach(command => command.SelectedVarieties!)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(120)
            .When(command => command.SelectedVarieties is not null);

        RuleFor(command => command.SelectedPackagingOptions)
            .Must(HaveNoDuplicateValues)
            .WithMessage("selected packaging options contain duplicate values.")
            .Must(HaveAllowedCount)
            .WithMessage($"selected packaging options exceed the maximum allowed selections ({MaxSelectionItems}).");

        RuleForEach(command => command.SelectedPackagingOptions!)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(120)
            .When(command => command.SelectedPackagingOptions is not null);

        RuleFor(command => command.SelectedWeightOptions)
            .Must(HaveNoDuplicateValues)
            .WithMessage("selected weight options contain duplicate values.")
            .Must(HaveAllowedCount)
            .WithMessage($"selected weight options exceed the maximum allowed selections ({MaxSelectionItems}).");

        RuleForEach(command => command.SelectedWeightOptions!)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(120)
            .When(command => command.SelectedWeightOptions is not null);

        RuleFor(command => command.SelectedSizeOptions)
            .Must(HaveNoDuplicateValues)
            .WithMessage("selected size options contain duplicate values.")
            .Must(HaveAllowedCount)
            .WithMessage($"selected size options exceed the maximum allowed selections ({MaxSelectionItems}).");

        RuleForEach(command => command.SelectedSizeOptions!)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(120)
            .When(command => command.SelectedSizeOptions is not null);

        RuleFor(command => command.SelectedGradeOptions)
            .Must(HaveNoDuplicateValues)
            .WithMessage("selected grade options contain duplicate values.")
            .Must(HaveAllowedCount)
            .WithMessage($"selected grade options exceed the maximum allowed selections ({MaxSelectionItems}).");

        RuleForEach(command => command.SelectedGradeOptions!)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(120)
            .When(command => command.SelectedGradeOptions is not null);

        RuleFor(command => command.SpecialSpecification)
            .MaximumLength(2000)
            .When(command => !string.IsNullOrWhiteSpace(command.SpecialSpecification));
    }

    private static bool HaveAllowedCount(IReadOnlyCollection<string>? values)
    {
        return values is null || values.Count <= MaxSelectionItems;
    }

    private static bool HaveNoDuplicateValues(IReadOnlyCollection<string>? values)
    {
        if (values is null || values.Count <= 1)
        {
            return true;
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var rawValue in values)
        {
            var value = rawValue?.Trim() ?? string.Empty;

            if (!seen.Add(value))
            {
                return false;
            }
        }

        return true;
    }
}

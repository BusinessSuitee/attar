using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using Alatar.Domain.OrderRequests;
using Alatar.Domain.Products;
using MediatR;

namespace Alatar.Application.Features.OrderRequests.AddOrderRequest;

public sealed class AddOrderRequestCommandHandler(
    IOrderRequestRepository orderRequestRepository,
    IProductRepository productRepository) : IRequestHandler<AddOrderRequestCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddOrderRequestCommand command, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdAsync(command.ProductId, cancellationToken);

        if (product is null)
        {
            return Result.Failure<Guid>(Error.NotFound(
                "Products.NotFound",
                $"Product with id '{command.ProductId}' was not found."));
        }

        var varieties = ResolveAvailableOptions(product.VarietiesJson, product.VarietiesLocalizedJson);
        var packagingOptions = ResolveAvailableOptions(product.PackagingOptionsJson, product.PackagingOptionsLocalizedJson);
        var weightOptions = ResolveAvailableOptions(product.WeightOptionsJson, product.WeightOptionsLocalizedJson);
        var sizeOptions = ResolveAvailableOptions(product.SizeOptionsJson, product.SizeOptionsLocalizedJson);
        var gradeOptions = ResolveAvailableOptions(product.GradeOptionsJson, product.GradeOptionsLocalizedJson);

        var selectedVarieties = NormalizeSelections(command.SelectedVarieties);
        var selectedPackagingOptions = NormalizeSelections(command.SelectedPackagingOptions);
        var selectedWeightOptions = NormalizeSelections(command.SelectedWeightOptions);
        var selectedSizeOptions = NormalizeSelections(command.SelectedSizeOptions);
        var selectedGradeOptions = NormalizeSelections(command.SelectedGradeOptions);

        var varietyValidation = ValidateSelectedOptions(selectedVarieties, varieties, "variety");
        if (varietyValidation != Error.None)
        {
            return Result.Failure<Guid>(varietyValidation);
        }

        var packagingValidation = ValidateSelectedOptions(selectedPackagingOptions, packagingOptions, "packaging");
        if (packagingValidation != Error.None)
        {
            return Result.Failure<Guid>(packagingValidation);
        }

        var weightValidation = ValidateSelectedOptions(selectedWeightOptions, weightOptions, "weight");
        if (weightValidation != Error.None)
        {
            return Result.Failure<Guid>(weightValidation);
        }

        var sizeValidation = ValidateSelectedOptions(selectedSizeOptions, sizeOptions, "size");
        if (sizeValidation != Error.None)
        {
            return Result.Failure<Guid>(sizeValidation);
        }

        var gradeValidation = ValidateSelectedOptions(selectedGradeOptions, gradeOptions, "grade");
        if (gradeValidation != Error.None)
        {
            return Result.Failure<Guid>(gradeValidation);
        }

        var productNameSnapshot = string.IsNullOrWhiteSpace(product.NameAr)
            ? product.Name
            : product.NameAr;

        var orderRequest = OrderRequest.Create(
            command.ProductId,
            productNameSnapshot,
            command.RequesterName,
            command.PhoneNumber,
            command.QuantityTons,
            ResolveSelectedOptions(selectedVarieties, varieties),
            ResolveSelectedOptions(selectedPackagingOptions, packagingOptions),
            ResolveSelectedOptions(selectedWeightOptions, weightOptions),
            ResolveSelectedOptions(selectedSizeOptions, sizeOptions),
            ResolveSelectedOptions(selectedGradeOptions, gradeOptions),
            command.SpecialSpecification);

        await orderRequestRepository.AddAsync(orderRequest, cancellationToken);

        return Result.Success(orderRequest.Id);
    }

    private static IReadOnlyCollection<LocalizedProductOption> ResolveAvailableOptions(
        string? legacyJson,
        string? localizedJson)
    {
        var legacy = ProductOptionJson.DeserializeLegacy(legacyJson);
        return ProductOptionJson.Normalize(
            ProductOptionJson.DeserializeLocalized(localizedJson),
            legacy,
            appendLegacyWhenLocalizedExists: false);
    }

    private static Error ValidateSelectedOptions(
        IReadOnlyCollection<string> selectedValues,
        IReadOnlyCollection<LocalizedProductOption> availableOptions,
        string optionName)
    {
        if (availableOptions.Count == 0)
        {
            if (selectedValues.Count > 0)
            {
                return Error.Validation(
                    "OrderRequests.InvalidSelection",
                    $"{optionName} is not available for this product.");
            }

            return Error.None;
        }

        if (selectedValues.Count == 0)
        {
            return Error.Validation(
                "OrderRequests.MissingSelection",
                $"{optionName} selection is required.");
        }

        foreach (var selectedValue in selectedValues)
        {
            if (FindOption(selectedValue, availableOptions) is null)
            {
                return Error.Validation(
                    "OrderRequests.InvalidSelection",
                    $"{optionName} selection is invalid.");
            }
        }

        return Error.None;
    }

    private static IReadOnlyCollection<string> ResolveSelectedOptions(
        IReadOnlyCollection<string> selectedValues,
        IReadOnlyCollection<LocalizedProductOption> availableOptions)
    {
        if (availableOptions.Count == 0 || selectedValues.Count == 0)
        {
            return [];
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var resolvedValues = new List<string>();

        foreach (var selectedValue in selectedValues)
        {
            var option = FindOption(selectedValue, availableOptions);

            var resolved = option is null
                ? selectedValue.Trim()
                : string.IsNullOrWhiteSpace(option.LabelEn)
                    ? option.LabelAr
                    : option.LabelEn;

            if (string.IsNullOrWhiteSpace(resolved))
            {
                continue;
            }

            resolved = resolved.Trim();

            if (seen.Add(resolved))
            {
                resolvedValues.Add(resolved);
            }
        }

        return resolvedValues;
    }

    private static LocalizedProductOption? FindOption(
        string selectedValue,
        IReadOnlyCollection<LocalizedProductOption> availableOptions)
    {
        var normalized = selectedValue.Trim();
        return availableOptions.FirstOrDefault(item =>
            string.Equals(item.Key, normalized, StringComparison.OrdinalIgnoreCase)
            || string.Equals(item.LabelEn, normalized, StringComparison.OrdinalIgnoreCase)
            || string.Equals(item.LabelAr, normalized, StringComparison.OrdinalIgnoreCase));
    }

    private static IReadOnlyCollection<string> NormalizeSelections(IReadOnlyCollection<string>? selectedValues)
    {
        if (selectedValues is null || selectedValues.Count == 0)
        {
            return [];
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var normalized = new List<string>();

        foreach (var rawValue in selectedValues)
        {
            var value = (rawValue ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            if (seen.Add(value))
            {
                normalized.Add(value);
            }
        }

        return normalized;
    }
}

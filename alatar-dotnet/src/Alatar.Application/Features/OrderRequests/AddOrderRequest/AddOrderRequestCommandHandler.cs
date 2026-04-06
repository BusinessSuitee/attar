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

        var varietyValidation = ValidateSelectedOption(command.SelectedVariety, varieties, "variety");
        if (varietyValidation != Error.None)
        {
            return Result.Failure<Guid>(varietyValidation);
        }

        var packagingValidation = ValidateSelectedOption(command.SelectedPackaging, packagingOptions, "packaging");
        if (packagingValidation != Error.None)
        {
            return Result.Failure<Guid>(packagingValidation);
        }

        var weightValidation = ValidateSelectedOption(command.SelectedWeight, weightOptions, "weight");
        if (weightValidation != Error.None)
        {
            return Result.Failure<Guid>(weightValidation);
        }

        var sizeValidation = ValidateSelectedOption(command.SelectedSize, sizeOptions, "size");
        if (sizeValidation != Error.None)
        {
            return Result.Failure<Guid>(sizeValidation);
        }

        var gradeValidation = ValidateSelectedOption(command.SelectedGrade, gradeOptions, "grade");
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
            ResolveSelectedOption(command.SelectedVariety, varieties),
            ResolveSelectedOption(command.SelectedPackaging, packagingOptions),
            ResolveSelectedOption(command.SelectedWeight, weightOptions),
            ResolveSelectedOption(command.SelectedSize, sizeOptions),
            ResolveSelectedOption(command.SelectedGrade, gradeOptions));

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

    private static Error ValidateSelectedOption(
        string? selectedValue,
        IReadOnlyCollection<LocalizedProductOption> availableOptions,
        string optionName)
    {
        if (availableOptions.Count == 0)
        {
            if (!string.IsNullOrWhiteSpace(selectedValue))
            {
                return Error.Validation(
                    "OrderRequests.InvalidSelection",
                    $"{optionName} is not available for this product.");
            }

            return Error.None;
        }

        if (string.IsNullOrWhiteSpace(selectedValue))
        {
            return Error.Validation(
                "OrderRequests.MissingSelection",
                $"{optionName} selection is required.");
        }

        if (FindOption(selectedValue, availableOptions) is null)
        {
            return Error.Validation(
                "OrderRequests.InvalidSelection",
                $"{optionName} selection is invalid.");
        }

        return Error.None;
    }

    private static string? ResolveSelectedOption(
        string? selectedValue,
        IReadOnlyCollection<LocalizedProductOption> availableOptions)
    {
        if (availableOptions.Count == 0 || string.IsNullOrWhiteSpace(selectedValue))
        {
            return null;
        }

        var option = FindOption(selectedValue, availableOptions);
        if (option is null)
        {
            return selectedValue.Trim();
        }

        return string.IsNullOrWhiteSpace(option.LabelEn)
            ? option.LabelAr
            : option.LabelEn;
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
}

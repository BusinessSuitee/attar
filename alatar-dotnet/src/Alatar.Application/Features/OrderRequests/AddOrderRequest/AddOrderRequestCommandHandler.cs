using System.Text.Json;
using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using Alatar.Domain.OrderRequests;
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

        var varieties = DeserializeJsonArray(product.VarietiesJson);
        var packagingOptions = DeserializeJsonArray(product.PackagingOptionsJson);
        var weightOptions = DeserializeJsonArray(product.WeightOptionsJson);
        var sizeOptions = DeserializeJsonArray(product.SizeOptionsJson);
        var gradeOptions = DeserializeJsonArray(product.GradeOptionsJson);

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

    private static IReadOnlyCollection<string> DeserializeJsonArray(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        try
        {
            return (JsonSerializer.Deserialize<string[]>(value) ?? [])
                .Select(item => item.Trim())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }
        catch
        {
            return [];
        }
    }

    private static Error ValidateSelectedOption(
        string? selectedValue,
        IReadOnlyCollection<string> availableOptions,
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

        var normalized = selectedValue.Trim();

        if (!availableOptions.Any(item => string.Equals(item, normalized, StringComparison.OrdinalIgnoreCase)))
        {
            return Error.Validation(
                "OrderRequests.InvalidSelection",
                $"{optionName} selection is invalid.");
        }

        return Error.None;
    }

    private static string? ResolveSelectedOption(
        string? selectedValue,
        IReadOnlyCollection<string> availableOptions)
    {
        if (availableOptions.Count == 0 || string.IsNullOrWhiteSpace(selectedValue))
        {
            return null;
        }

        var normalized = selectedValue.Trim();
        return availableOptions.FirstOrDefault(item =>
                   string.Equals(item, normalized, StringComparison.OrdinalIgnoreCase))
               ?? normalized;
    }
}

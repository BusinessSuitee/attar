namespace Alatar.Api.Contracts.OrderRequests;

public sealed record CreateOrderRequestRequest(
    Guid ProductId,
    IReadOnlyCollection<string>? SelectedVarieties,
    IReadOnlyCollection<string>? SelectedPackagingOptions,
    IReadOnlyCollection<string>? SelectedWeightOptions,
    IReadOnlyCollection<string>? SelectedSizeOptions,
    IReadOnlyCollection<string>? SelectedGradeOptions,
    string? SpecialSpecification,
    string RequesterName,
    string PhoneNumber,
    decimal QuantityTons);

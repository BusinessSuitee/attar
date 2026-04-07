namespace Alatar.Application.Features.OrderRequests.GetOrderRequests;

public sealed record OrderRequestListItemResponse(
    Guid Id,
    Guid ProductId,
    string ProductNameSnapshot,
    string RequesterName,
    string PhoneNumber,
    decimal QuantityTons,
    IReadOnlyCollection<string> SelectedVarieties,
    IReadOnlyCollection<string> SelectedPackagingOptions,
    IReadOnlyCollection<string> SelectedWeightOptions,
    IReadOnlyCollection<string> SelectedSizeOptions,
    IReadOnlyCollection<string> SelectedGradeOptions,
    string? SpecialSpecification,
    string Status,
    DateTime CreatedAtUtc);

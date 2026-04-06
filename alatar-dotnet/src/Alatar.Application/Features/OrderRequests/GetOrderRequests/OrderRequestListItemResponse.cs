namespace Alatar.Application.Features.OrderRequests.GetOrderRequests;

public sealed record OrderRequestListItemResponse(
    Guid Id,
    Guid ProductId,
    string ProductNameSnapshot,
    string RequesterName,
    string PhoneNumber,
    decimal QuantityTons,
    string? SelectedVariety,
    string? SelectedPackaging,
    string? SelectedWeight,
    string? SelectedSize,
    string? SelectedGrade,
    string Status,
    DateTime CreatedAtUtc);

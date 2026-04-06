namespace Alatar.Api.Contracts.OrderRequests;

public sealed record CreateOrderRequestRequest(
    Guid ProductId,
    string? SelectedVariety,
    string? SelectedPackaging,
    string? SelectedWeight,
    string? SelectedSize,
    string? SelectedGrade,
    string RequesterName,
    string PhoneNumber,
    decimal QuantityTons);

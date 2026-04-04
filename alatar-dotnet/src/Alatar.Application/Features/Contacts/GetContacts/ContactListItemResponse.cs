namespace Alatar.Application.Features.Contacts.GetContacts;

public sealed record ContactListItemResponse(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string ServiceType,
    string Status,
    string? CompanyName,
    string? Country,
    string? Crop,
    decimal? QuantityTons,
    string? DeliveryWindow,
    string? Notes,
    DateTime CreatedAtUtc);

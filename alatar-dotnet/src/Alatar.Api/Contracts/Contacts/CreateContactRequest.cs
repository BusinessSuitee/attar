namespace Alatar.Api.Contracts.Contacts;

public sealed record CreateContactRequest(
    string FullName,
    string PhoneNumber,
    int ServiceType,
    string? CompanyName,
    string? Country,
    string? Crop,
    decimal? QuantityTons,
    string? DeliveryWindow,
    string? Notes);

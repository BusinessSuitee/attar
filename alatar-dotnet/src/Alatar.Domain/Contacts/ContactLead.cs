namespace Alatar.Domain.Contacts;

public sealed class ContactLead
{
    private ContactLead()
    {
    }

    private ContactLead(
        Guid id,
        string fullName,
        string phoneNumber,
        ContactServiceType serviceType,
        ContactLeadStatus status,
        string? companyName,
        string? country,
        string? crop,
        decimal? quantityTons,
        string? deliveryWindow,
        string? notes)
    {
        Id = id;
        FullName = fullName;
        PhoneNumber = phoneNumber;
        ServiceType = serviceType;
        Status = status;
        CompanyName = companyName;
        Country = country;
        Crop = crop;
        QuantityTons = quantityTons;
        DeliveryWindow = deliveryWindow;
        Notes = notes;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public ContactServiceType ServiceType { get; private set; }
    public ContactLeadStatus Status { get; private set; }
    public string? CompanyName { get; private set; }
    public string? Country { get; private set; }
    public string? Crop { get; private set; }
    public decimal? QuantityTons { get; private set; }
    public string? DeliveryWindow { get; private set; }
    public string? Notes { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static ContactLead Create(
        string fullName,
        string phoneNumber,
        ContactServiceType serviceType,
        string? companyName,
        string? country,
        string? crop,
        decimal? quantityTons,
        string? deliveryWindow,
        string? notes)
    {
        EnsureFullName(fullName);
        EnsurePhoneNumber(phoneNumber);
        EnsureCountryForExport(serviceType, country);
        EnsureQuantity(quantityTons);

        return new ContactLead(
            Guid.NewGuid(),
            fullName.Trim(),
            phoneNumber.Trim(),
            serviceType,
            ContactLeadStatus.InProgress,
            Normalize(companyName),
            Normalize(country),
            Normalize(crop),
            quantityTons,
            Normalize(deliveryWindow),
            Normalize(notes));
    }

    public void SetStatus(ContactLeadStatus status)
    {
        Status = status;
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static void EnsureFullName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Trim().Length < 3)
        {
            throw new ArgumentException("Full name must be at least 3 characters.", nameof(fullName));
        }
    }

    private static void EnsurePhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber) || phoneNumber.Trim().Length < 7)
        {
            throw new ArgumentException("Phone number is required.", nameof(phoneNumber));
        }
    }

    private static void EnsureCountryForExport(ContactServiceType serviceType, string? country)
    {
        if (serviceType == ContactServiceType.Export && string.IsNullOrWhiteSpace(country))
        {
            throw new ArgumentException("Country is required for export requests.", nameof(country));
        }
    }

    private static void EnsureQuantity(decimal? quantityTons)
    {
        if (quantityTons is < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantityTons), "Quantity cannot be negative.");
        }
    }
}

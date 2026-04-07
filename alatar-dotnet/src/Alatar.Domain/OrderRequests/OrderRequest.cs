using System.Text.Json;

namespace Alatar.Domain.OrderRequests;

public sealed class OrderRequest
{
    private OrderRequest()
    {
    }

    private OrderRequest(
        Guid id,
        Guid productId,
        string productNameSnapshot,
        string requesterName,
        string phoneNumber,
        decimal quantityTons,
        IReadOnlyCollection<string> selectedVarieties,
        IReadOnlyCollection<string> selectedPackagingOptions,
        IReadOnlyCollection<string> selectedWeightOptions,
        IReadOnlyCollection<string> selectedSizeOptions,
        IReadOnlyCollection<string> selectedGradeOptions,
        string? specialSpecification)
    {
        Id = id;
        ProductId = productId;
        ProductNameSnapshot = productNameSnapshot;
        RequesterName = requesterName;
        PhoneNumber = phoneNumber;
        QuantityTons = quantityTons;
        SelectedVariety = SerializeSelections(selectedVarieties);
        SelectedPackaging = SerializeSelections(selectedPackagingOptions);
        SelectedWeight = SerializeSelections(selectedWeightOptions);
        SelectedSize = SerializeSelections(selectedSizeOptions);
        SelectedGrade = SerializeSelections(selectedGradeOptions);
        SpecialSpecification = Normalize(specialSpecification);
        Status = OrderRequestStatus.New;
        IsDeleted = false;
        DeletedAtUtc = null;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductNameSnapshot { get; private set; } = string.Empty;
    public string RequesterName { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public decimal QuantityTons { get; private set; }
    public string? SelectedVariety { get; private set; }
    public string? SelectedPackaging { get; private set; }
    public string? SelectedWeight { get; private set; }
    public string? SelectedSize { get; private set; }
    public string? SelectedGrade { get; private set; }
    public string? SpecialSpecification { get; private set; }
    public OrderRequestStatus Status { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public static OrderRequest Create(
        Guid productId,
        string productNameSnapshot,
        string requesterName,
        string phoneNumber,
        decimal quantityTons,
        IReadOnlyCollection<string> selectedVarieties,
        IReadOnlyCollection<string> selectedPackagingOptions,
        IReadOnlyCollection<string> selectedWeightOptions,
        IReadOnlyCollection<string> selectedSizeOptions,
        IReadOnlyCollection<string> selectedGradeOptions,
        string? specialSpecification)
    {
        EnsureProduct(productId, productNameSnapshot);
        EnsureRequesterName(requesterName);
        EnsurePhoneNumber(phoneNumber);
        EnsureQuantity(quantityTons);

        return new OrderRequest(
            Guid.NewGuid(),
            productId,
            productNameSnapshot.Trim(),
            requesterName.Trim(),
            phoneNumber.Trim(),
            decimal.Round(quantityTons, 2, MidpointRounding.AwayFromZero),
            NormalizeSelections(selectedVarieties),
            NormalizeSelections(selectedPackagingOptions),
            NormalizeSelections(selectedWeightOptions),
            NormalizeSelections(selectedSizeOptions),
            NormalizeSelections(selectedGradeOptions),
            specialSpecification);
    }

    public IReadOnlyCollection<string> GetSelectedVarieties()
    {
        return DeserializeSelections(SelectedVariety);
    }

    public IReadOnlyCollection<string> GetSelectedPackagingOptions()
    {
        return DeserializeSelections(SelectedPackaging);
    }

    public IReadOnlyCollection<string> GetSelectedWeightOptions()
    {
        return DeserializeSelections(SelectedWeight);
    }

    public IReadOnlyCollection<string> GetSelectedSizeOptions()
    {
        return DeserializeSelections(SelectedSize);
    }

    public IReadOnlyCollection<string> GetSelectedGradeOptions()
    {
        return DeserializeSelections(SelectedGrade);
    }

    public void SetStatus(OrderRequestStatus status)
    {
        if (Status == status)
        {
            return;
        }

        Status = status;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SoftDelete()
    {
        if (IsDeleted)
        {
            return;
        }

        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static IReadOnlyCollection<string> NormalizeSelections(IReadOnlyCollection<string>? values)
    {
        if (values is null || values.Count == 0)
        {
            return [];
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var normalized = new List<string>();

        foreach (var rawValue in values)
        {
            var value = Normalize(rawValue);

            if (value is null)
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

    private static string? SerializeSelections(IReadOnlyCollection<string>? values)
    {
        var normalized = NormalizeSelections(values);

        if (normalized.Count == 0)
        {
            return null;
        }

        return JsonSerializer.Serialize(normalized);
    }

    private static IReadOnlyCollection<string> DeserializeSelections(string? serializedValue)
    {
        if (string.IsNullOrWhiteSpace(serializedValue))
        {
            return [];
        }

        var normalized = serializedValue.Trim();

        if (normalized.StartsWith('['))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<string[]>(normalized);
                return NormalizeSelections(parsed ?? []);
            }
            catch
            {
                // Fallback to legacy plain string value
            }
        }

        return [normalized];
    }

    private static void EnsureProduct(Guid productId, string productNameSnapshot)
    {
        if (productId == Guid.Empty)
        {
            throw new ArgumentException("Product id is required.", nameof(productId));
        }

        if (string.IsNullOrWhiteSpace(productNameSnapshot))
        {
            throw new ArgumentException("Product name snapshot is required.", nameof(productNameSnapshot));
        }
    }

    private static void EnsureRequesterName(string requesterName)
    {
        if (string.IsNullOrWhiteSpace(requesterName) || requesterName.Trim().Length < 3)
        {
            throw new ArgumentException("Requester name must be at least 3 characters.", nameof(requesterName));
        }
    }

    private static void EnsurePhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber) || phoneNumber.Trim().Length < 7)
        {
            throw new ArgumentException("Phone number is required.", nameof(phoneNumber));
        }
    }

    private static void EnsureQuantity(decimal quantityTons)
    {
        if (quantityTons <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantityTons), "Quantity must be greater than zero.");
        }
    }
}

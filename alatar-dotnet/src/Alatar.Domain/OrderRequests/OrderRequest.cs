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
        string? selectedVariety,
        string? selectedPackaging,
        string? selectedWeight,
        string? selectedSize,
        string? selectedGrade)
    {
        Id = id;
        ProductId = productId;
        ProductNameSnapshot = productNameSnapshot;
        RequesterName = requesterName;
        PhoneNumber = phoneNumber;
        QuantityTons = quantityTons;
        SelectedVariety = selectedVariety;
        SelectedPackaging = selectedPackaging;
        SelectedWeight = selectedWeight;
        SelectedSize = selectedSize;
        SelectedGrade = selectedGrade;
        Status = OrderRequestStatus.New;
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
    public OrderRequestStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public static OrderRequest Create(
        Guid productId,
        string productNameSnapshot,
        string requesterName,
        string phoneNumber,
        decimal quantityTons,
        string? selectedVariety,
        string? selectedPackaging,
        string? selectedWeight,
        string? selectedSize,
        string? selectedGrade)
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
            Normalize(selectedVariety),
            Normalize(selectedPackaging),
            Normalize(selectedWeight),
            Normalize(selectedSize),
            Normalize(selectedGrade));
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

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
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

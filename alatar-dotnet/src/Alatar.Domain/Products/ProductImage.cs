namespace Alatar.Domain.Products;

public sealed class ProductImage
{
    private ProductImage()
    {
    }

    private ProductImage(Guid id, Guid productId, string relativePath, int displayOrder)
    {
        Id = id;
        ProductId = productId;
        RelativePath = relativePath;
        DisplayOrder = displayOrder;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string RelativePath { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static ProductImage Create(Guid productId, string relativePath, int displayOrder)
    {
        if (productId == Guid.Empty)
        {
            throw new ArgumentException("Product id is required.", nameof(productId));
        }

        if (string.IsNullOrWhiteSpace(relativePath))
        {
            throw new ArgumentException("Relative path is required.", nameof(relativePath));
        }

        if (displayOrder < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(displayOrder), "Display order cannot be negative.");
        }

        return new ProductImage(Guid.NewGuid(), productId, relativePath.Trim(), displayOrder);
    }
}

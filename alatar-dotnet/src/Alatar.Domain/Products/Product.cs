namespace Alatar.Domain.Products;

public sealed class Product
{
    private Product()
    {
    }

    private Product(Guid id, string name, string sku, decimal price, int stockQuantity)
    {
        Id = id;
        Name = name;
        Sku = sku;
        Price = price;
        StockQuantity = stockQuantity;
        Status = ProductStatus.Active;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Sku { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }
    public ProductStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public static Product Create(string name, string sku, decimal price, int openingStock)
    {
        EnsureName(name);
        EnsureSku(sku);
        EnsurePrice(price);
        EnsureStock(openingStock);

        return new Product(
            Guid.NewGuid(),
            name.Trim(),
            sku.Trim().ToUpperInvariant(),
            decimal.Round(price, 2, MidpointRounding.AwayFromZero),
            openingStock);
    }

    public void Rename(string name)
    {
        EnsureName(name);
        Name = name.Trim();
        Touch();
    }

    public void ChangePrice(decimal newPrice)
    {
        EnsurePrice(newPrice);
        Price = decimal.Round(newPrice, 2, MidpointRounding.AwayFromZero);
        Touch();
    }

    public void AddStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Stock delta must be greater than zero.");
        }

        StockQuantity += quantity;
        Touch();
    }

    public void RemoveStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Stock delta must be greater than zero.");
        }

        if (StockQuantity - quantity < 0)
        {
            throw new InvalidOperationException("Stock cannot be negative.");
        }

        StockQuantity -= quantity;
        Touch();
    }

    public void Activate()
    {
        if (Status == ProductStatus.Active)
        {
            return;
        }

        Status = ProductStatus.Active;
        Touch();
    }

    public void Deactivate()
    {
        if (Status == ProductStatus.Inactive)
        {
            return;
        }

        Status = ProductStatus.Inactive;
        Touch();
    }

    private static void EnsureName(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length < 3)
        {
            throw new ArgumentException("Product name must be at least 3 characters.", nameof(name));
        }
    }

    private static void EnsureSku(string sku)
    {
        if (string.IsNullOrWhiteSpace(sku) || sku.Trim().Length < 3)
        {
            throw new ArgumentException("SKU must be at least 3 characters.", nameof(sku));
        }
    }

    private static void EnsurePrice(decimal price)
    {
        if (price <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(price), "Price must be greater than zero.");
        }
    }

    private static void EnsureStock(int stock)
    {
        if (stock < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(stock), "Stock cannot be negative.");
        }
    }

    private void Touch()
    {
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
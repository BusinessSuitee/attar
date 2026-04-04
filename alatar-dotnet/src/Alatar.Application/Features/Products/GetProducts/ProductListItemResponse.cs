namespace Alatar.Application.Features.Products.GetProducts;

public sealed record ProductListItemResponse(
    Guid Id,
    string Name,
    string Sku,
    decimal Price,
    int StockQuantity,
    string Status);

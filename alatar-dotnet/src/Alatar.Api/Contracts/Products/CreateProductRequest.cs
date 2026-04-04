namespace Alatar.Api.Contracts.Products;

public sealed record CreateProductRequest(
    string Name,
    string Sku,
    decimal Price,
    int OpeningStock);

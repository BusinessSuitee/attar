namespace Alatar.Api.Contracts.Products;

public sealed record LocalizedProductOptionRequest(
    string Key,
    string LabelEn,
    string LabelAr);
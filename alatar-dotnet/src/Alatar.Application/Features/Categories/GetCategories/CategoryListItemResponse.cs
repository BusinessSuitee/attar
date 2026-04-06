namespace Alatar.Application.Features.Categories.GetCategories;

public sealed record CategoryListItemResponse(
    Guid Id,
    string Name,
    string Type,
    string Season);

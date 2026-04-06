using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Categories.GetCategories;

public sealed class GetCategoriesQueryHandler(ICategoryRepository categoryRepository)
    : IRequestHandler<GetCategoriesQuery, Result<IReadOnlyCollection<CategoryListItemResponse>>>
{
    public async Task<Result<IReadOnlyCollection<CategoryListItemResponse>>> Handle(
        GetCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        var categories = await categoryRepository.ListAsync(cancellationToken);

        IReadOnlyCollection<CategoryListItemResponse> response = categories
            .Select(c => new CategoryListItemResponse(
                c.Id,
                c.Name,
                c.Type.ToString(),
                c.Season.ToString()))
            .ToArray();

        return Result.Success(response);
    }
}

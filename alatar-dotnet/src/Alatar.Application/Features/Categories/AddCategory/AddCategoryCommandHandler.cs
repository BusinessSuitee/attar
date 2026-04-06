using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using Alatar.Domain.Categories;
using MediatR;

namespace Alatar.Application.Features.Categories.AddCategory;

public sealed class AddCategoryCommandHandler(ICategoryRepository categoryRepository)
    : IRequestHandler<AddCategoryCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddCategoryCommand command, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<CategoryType>(command.Type, true, out var categoryType))
        {
            return Result.Failure<Guid>(Error.Validation(
                "Categories.InvalidType",
                $"Invalid category type '{command.Type}'. Valid types: Fruits, Vegetables, Frozen."));
        }

        if (!Enum.TryParse<Season>(command.Season, true, out var season))
        {
            return Result.Failure<Guid>(Error.Validation(
                "Categories.InvalidSeason",
                $"Invalid season '{command.Season}'. Valid seasons: Summer, Winter, AllYear."));
        }

        var normalizedName = command.Name.Trim().ToUpperInvariant();

        if (await categoryRepository.ExistsByNormalizedNameAsync(normalizedName, cancellationToken))
        {
            return Result.Failure<Guid>(Error.Conflict(
                "Categories.NameAlreadyExists",
                $"Category with name '{command.Name.Trim()}' already exists."));
        }

        var category = Category.Create(command.Name, categoryType, season);
        await categoryRepository.AddAsync(category, cancellationToken);

        return Result.Success(category.Id);
    }
}

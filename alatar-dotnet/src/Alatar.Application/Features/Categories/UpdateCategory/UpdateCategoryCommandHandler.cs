using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using Alatar.Domain.Categories;
using MediatR;

namespace Alatar.Application.Features.Categories.UpdateCategory;

public sealed class UpdateCategoryCommandHandler(ICategoryRepository categoryRepository)
    : IRequestHandler<UpdateCategoryCommand, Result>
{
    public async Task<Result> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetByIdAsync(command.Id, cancellationToken);

        if (category is null)
        {
            return Result.Failure(Error.NotFound(
                "Categories.NotFound",
                $"Category with id '{command.Id}' was not found."));
        }

        if (!Enum.TryParse<CategoryType>(command.Type, true, out var categoryType))
        {
            return Result.Failure(Error.Validation(
                "Categories.InvalidType",
                $"Invalid category type '{command.Type}'."));
        }

        if (!Enum.TryParse<Season>(command.Season, true, out var season))
        {
            return Result.Failure(Error.Validation(
                "Categories.InvalidSeason",
                $"Invalid season '{command.Season}'."));
        }

        category.Rename(command.Name);
        category.ChangeType(categoryType);
        category.ChangeSeason(season);

        await categoryRepository.UpdateAsync(category, cancellationToken);

        return Result.Success();
    }
}

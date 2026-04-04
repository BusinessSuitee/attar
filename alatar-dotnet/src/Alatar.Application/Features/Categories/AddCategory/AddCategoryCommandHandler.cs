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
        var normalizedName = command.Name.Trim().ToUpperInvariant();

        if (await categoryRepository.ExistsByNormalizedNameAsync(normalizedName, cancellationToken))
        {
            return Result.Failure<Guid>(Error.Conflict(
                "Categories.NameAlreadyExists",
                $"Category with name '{command.Name.Trim()}' already exists."));
        }

        var category = Category.Create(command.Name);
        await categoryRepository.AddAsync(category, cancellationToken);

        return Result.Success(category.Id);
    }
}

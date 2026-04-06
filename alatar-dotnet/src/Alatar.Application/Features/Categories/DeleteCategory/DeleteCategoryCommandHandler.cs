using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Categories.DeleteCategory;

public sealed class DeleteCategoryCommandHandler(ICategoryRepository categoryRepository)
    : IRequestHandler<DeleteCategoryCommand, Result>
{
    public async Task<Result> Handle(DeleteCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetByIdAsync(command.Id, cancellationToken);

        if (category is null)
        {
            return Result.Failure(Error.NotFound(
                "Categories.NotFound",
                $"Category with id '{command.Id}' was not found."));
        }

        await categoryRepository.RemoveAsync(category, cancellationToken);

        return Result.Success();
    }
}

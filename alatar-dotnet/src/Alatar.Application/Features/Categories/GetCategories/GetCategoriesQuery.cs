using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Categories.GetCategories;

public sealed record GetCategoriesQuery : IRequest<Result<IReadOnlyCollection<CategoryListItemResponse>>>;

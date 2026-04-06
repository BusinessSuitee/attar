using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Categories.DeleteCategory;

public sealed record DeleteCategoryCommand(Guid Id) : IRequest<Result>;

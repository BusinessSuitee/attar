using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Categories.UpdateCategory;

public sealed record UpdateCategoryCommand(Guid Id, string Name, string Type, string Season) : IRequest<Result>;

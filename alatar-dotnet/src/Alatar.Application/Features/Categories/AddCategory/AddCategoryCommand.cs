using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Categories.AddCategory;

public sealed record AddCategoryCommand(string Name) : IRequest<Result<Guid>>;

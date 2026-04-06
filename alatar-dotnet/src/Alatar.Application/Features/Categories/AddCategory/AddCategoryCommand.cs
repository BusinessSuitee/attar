using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.Categories.AddCategory;

public sealed record AddCategoryCommand(string Name, string Type, string Season) : IRequest<Result<Guid>>;

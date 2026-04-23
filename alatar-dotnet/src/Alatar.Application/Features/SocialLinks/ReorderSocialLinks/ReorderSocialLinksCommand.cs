using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.ReorderSocialLinks;

public sealed record ReorderSocialLinksCommand(IReadOnlyList<Guid> OrderedIds) : IRequest<Result>;

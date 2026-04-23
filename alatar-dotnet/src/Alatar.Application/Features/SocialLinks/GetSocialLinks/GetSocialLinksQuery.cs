using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.GetSocialLinks;

public sealed record GetSocialLinksQuery(bool OnlyEnabled, string? CustomIconBaseUrl = null)
    : IRequest<Result<IReadOnlyCollection<SocialLinkResponse>>>;

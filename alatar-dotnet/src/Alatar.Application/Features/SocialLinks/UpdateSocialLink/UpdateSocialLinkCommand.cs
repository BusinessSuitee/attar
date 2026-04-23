using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.UpdateSocialLink;

public sealed record UpdateSocialLinkCommand(
    Guid Id,
    string Platform,
    string Url,
    string Label,
    string? IconKey,
    string? ColorHex,
    bool OpensInNewTab) : IRequest<Result>;

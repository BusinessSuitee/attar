using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.AddSocialLink;

public sealed record AddSocialLinkCommand(
    string Platform,
    string Url,
    string Label,
    string? IconKey,
    string? ColorHex,
    bool OpensInNewTab) : IRequest<Result<Guid>>;

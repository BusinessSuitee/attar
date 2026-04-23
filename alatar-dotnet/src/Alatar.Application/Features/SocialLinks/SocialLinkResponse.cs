namespace Alatar.Application.Features.SocialLinks;

public sealed record SocialLinkResponse(
    Guid Id,
    string Platform,
    string Url,
    string Label,
    string? IconKey,
    string? CustomIconUrl,
    string? ColorHex,
    int DisplayOrder,
    bool IsEnabled,
    bool OpensInNewTab);

namespace Alatar.Api.Contracts.SocialLinks;

public sealed record UpdateSocialLinkRequest(
    string Platform,
    string Url,
    string Label,
    string? IconKey,
    string? ColorHex,
    bool OpensInNewTab);

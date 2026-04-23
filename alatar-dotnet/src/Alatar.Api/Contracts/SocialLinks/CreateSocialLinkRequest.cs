namespace Alatar.Api.Contracts.SocialLinks;

public sealed record CreateSocialLinkRequest(
    string Platform,
    string Url,
    string Label,
    string? IconKey,
    string? ColorHex,
    bool OpensInNewTab);

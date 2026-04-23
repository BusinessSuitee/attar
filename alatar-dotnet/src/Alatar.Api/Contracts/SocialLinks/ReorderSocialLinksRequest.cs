namespace Alatar.Api.Contracts.SocialLinks;

public sealed record ReorderSocialLinksRequest(IReadOnlyList<Guid> OrderedIds);

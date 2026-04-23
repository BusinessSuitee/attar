using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.GetSocialLinks;

public sealed class GetSocialLinksQueryHandler(ISocialLinkRepository socialLinkRepository)
    : IRequestHandler<GetSocialLinksQuery, Result<IReadOnlyCollection<SocialLinkResponse>>>
{
    public async Task<Result<IReadOnlyCollection<SocialLinkResponse>>> Handle(
        GetSocialLinksQuery request,
        CancellationToken cancellationToken)
    {
        var links = request.OnlyEnabled
            ? await socialLinkRepository.ListEnabledAsync(cancellationToken)
            : await socialLinkRepository.ListAsync(cancellationToken);

        IReadOnlyCollection<SocialLinkResponse> response = links
            .OrderBy(link => link.DisplayOrder)
            .Select(link => new SocialLinkResponse(
                link.Id,
                link.Platform.ToString(),
                link.Url,
                link.Label,
                link.IconKey,
                BuildIconUrl(link.CustomIconPath, request.CustomIconBaseUrl),
                link.ColorHex,
                link.DisplayOrder,
                link.IsEnabled,
                link.OpensInNewTab))
            .ToArray();

        return Result.Success(response);
    }

    private static string? BuildIconUrl(string? customIconPath, string? baseUrl)
    {
        if (string.IsNullOrWhiteSpace(customIconPath))
        {
            return null;
        }

        var trimmedPath = customIconPath.TrimStart('/');

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return "/" + trimmedPath;
        }

        return baseUrl.TrimEnd('/') + "/" + trimmedPath;
    }
}

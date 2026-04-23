using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using Alatar.Domain.SocialLinks;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.AddSocialLink;

public sealed class AddSocialLinkCommandHandler(ISocialLinkRepository socialLinkRepository)
    : IRequestHandler<AddSocialLinkCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddSocialLinkCommand command, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<SocialPlatform>(command.Platform, true, out var platform))
        {
            return Result.Failure<Guid>(Error.Validation(
                "SocialLinks.InvalidPlatform",
                $"Invalid platform '{command.Platform}'."));
        }

        int nextOrder;
        try
        {
            nextOrder = await socialLinkRepository.GetMaxDisplayOrderAsync(cancellationToken) + 1;
        }
        catch
        {
            nextOrder = 0;
        }

        SocialLink entity;
        try
        {
            entity = SocialLink.Create(
                platform,
                command.Url,
                command.Label,
                command.IconKey,
                customIconPath: null,
                command.ColorHex,
                nextOrder,
                isEnabled: true,
                command.OpensInNewTab);
        }
        catch (ArgumentException exception)
        {
            return Result.Failure<Guid>(Error.Validation("SocialLinks.Invalid", exception.Message));
        }

        await socialLinkRepository.AddAsync(entity, cancellationToken);

        return Result.Success(entity.Id);
    }
}

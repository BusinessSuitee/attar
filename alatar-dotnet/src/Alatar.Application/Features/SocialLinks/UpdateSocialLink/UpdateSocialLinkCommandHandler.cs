using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using Alatar.Domain.SocialLinks;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.UpdateSocialLink;

public sealed class UpdateSocialLinkCommandHandler(ISocialLinkRepository socialLinkRepository)
    : IRequestHandler<UpdateSocialLinkCommand, Result>
{
    public async Task<Result> Handle(UpdateSocialLinkCommand command, CancellationToken cancellationToken)
    {
        var entity = await socialLinkRepository.GetByIdAsync(command.Id, cancellationToken);
        if (entity is null)
        {
            return Result.Failure(Error.NotFound(
                "SocialLinks.NotFound",
                $"Social link with id '{command.Id}' was not found."));
        }

        if (!Enum.TryParse<SocialPlatform>(command.Platform, true, out var platform))
        {
            return Result.Failure(Error.Validation(
                "SocialLinks.InvalidPlatform",
                $"Invalid platform '{command.Platform}'."));
        }

        try
        {
            entity.UpdateDetails(
                platform,
                command.Url,
                command.Label,
                command.IconKey,
                command.ColorHex,
                command.OpensInNewTab);
        }
        catch (ArgumentException exception)
        {
            return Result.Failure(Error.Validation("SocialLinks.Invalid", exception.Message));
        }

        await socialLinkRepository.UpdateAsync(entity, cancellationToken);
        return Result.Success();
    }
}

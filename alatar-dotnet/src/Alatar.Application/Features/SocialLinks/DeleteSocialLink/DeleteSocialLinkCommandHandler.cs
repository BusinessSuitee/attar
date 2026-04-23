using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.DeleteSocialLink;

public sealed class DeleteSocialLinkCommandHandler(ISocialLinkRepository socialLinkRepository)
    : IRequestHandler<DeleteSocialLinkCommand, Result<string?>>
{
    public async Task<Result<string?>> Handle(DeleteSocialLinkCommand command, CancellationToken cancellationToken)
    {
        var entity = await socialLinkRepository.GetByIdAsync(command.Id, cancellationToken);
        if (entity is null)
        {
            return Result.Failure<string?>(Error.NotFound(
                "SocialLinks.NotFound",
                $"Social link with id '{command.Id}' was not found."));
        }

        var customIconPath = entity.CustomIconPath;

        await socialLinkRepository.RemoveAsync(entity, cancellationToken);

        return Result.Success<string?>(customIconPath);
    }
}

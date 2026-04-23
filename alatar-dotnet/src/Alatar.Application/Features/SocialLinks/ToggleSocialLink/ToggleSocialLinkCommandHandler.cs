using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.ToggleSocialLink;

public sealed class ToggleSocialLinkCommandHandler(ISocialLinkRepository socialLinkRepository)
    : IRequestHandler<ToggleSocialLinkCommand, Result>
{
    public async Task<Result> Handle(ToggleSocialLinkCommand command, CancellationToken cancellationToken)
    {
        var entity = await socialLinkRepository.GetByIdAsync(command.Id, cancellationToken);
        if (entity is null)
        {
            return Result.Failure(Error.NotFound(
                "SocialLinks.NotFound",
                $"Social link with id '{command.Id}' was not found."));
        }

        entity.SetEnabled(command.IsEnabled);
        await socialLinkRepository.UpdateAsync(entity, cancellationToken);

        return Result.Success();
    }
}

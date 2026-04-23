using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.ReorderSocialLinks;

public sealed class ReorderSocialLinksCommandHandler(ISocialLinkRepository socialLinkRepository)
    : IRequestHandler<ReorderSocialLinksCommand, Result>
{
    public async Task<Result> Handle(ReorderSocialLinksCommand command, CancellationToken cancellationToken)
    {
        if (command.OrderedIds is null || command.OrderedIds.Count == 0)
        {
            return Result.Failure(Error.Validation(
                "SocialLinks.EmptyOrder",
                "At least one id is required to reorder social links."));
        }

        var all = await socialLinkRepository.ListAsync(cancellationToken);
        var map = all.ToDictionary(link => link.Id);

        for (var index = 0; index < command.OrderedIds.Count; index++)
        {
            if (!map.TryGetValue(command.OrderedIds[index], out var entity))
            {
                return Result.Failure(Error.NotFound(
                    "SocialLinks.NotFound",
                    $"Social link with id '{command.OrderedIds[index]}' was not found."));
            }

            entity.Reorder(index);
        }

        await socialLinkRepository.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.ToggleSocialLink;

public sealed record ToggleSocialLinkCommand(Guid Id, bool IsEnabled) : IRequest<Result>;

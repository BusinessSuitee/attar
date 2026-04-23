using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.SocialLinks.DeleteSocialLink;

public sealed record DeleteSocialLinkCommand(Guid Id) : IRequest<Result<string?>>;

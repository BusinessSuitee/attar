using FluentValidation;

namespace Alatar.Application.Features.SocialLinks.UpdateSocialLink;

public sealed class UpdateSocialLinkValidator : AbstractValidator<UpdateSocialLinkCommand>
{
    public UpdateSocialLinkValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
        RuleFor(command => command.Platform).NotEmpty();
        RuleFor(command => command.Url).NotEmpty().MaximumLength(500);
        RuleFor(command => command.Label).NotEmpty().MaximumLength(80);
        RuleFor(command => command.IconKey).MaximumLength(60);
        RuleFor(command => command.ColorHex).MaximumLength(9);
    }
}

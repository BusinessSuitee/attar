using FluentValidation;

namespace Alatar.Application.Features.SocialLinks.AddSocialLink;

public sealed class AddSocialLinkValidator : AbstractValidator<AddSocialLinkCommand>
{
    public AddSocialLinkValidator()
    {
        RuleFor(command => command.Platform).NotEmpty();
        RuleFor(command => command.Url).NotEmpty().MaximumLength(500);
        RuleFor(command => command.Label).NotEmpty().MaximumLength(80);
        RuleFor(command => command.IconKey).MaximumLength(60);
        RuleFor(command => command.ColorHex).MaximumLength(9);
    }
}

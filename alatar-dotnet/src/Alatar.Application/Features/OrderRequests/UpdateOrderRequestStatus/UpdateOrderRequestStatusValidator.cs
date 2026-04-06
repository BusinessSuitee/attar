using FluentValidation;

namespace Alatar.Application.Features.OrderRequests.UpdateOrderRequestStatus;

public sealed class UpdateOrderRequestStatusValidator : AbstractValidator<UpdateOrderRequestStatusCommand>
{
    public UpdateOrderRequestStatusValidator()
    {
        RuleFor(command => command.OrderRequestId)
            .NotEmpty();

        RuleFor(command => command.Status)
            .IsInEnum();
    }
}

using FluentValidation;

namespace Alatar.Application.Features.OrderRequests.DeleteOrderRequest;

public sealed class DeleteOrderRequestValidator : AbstractValidator<DeleteOrderRequestCommand>
{
    public DeleteOrderRequestValidator()
    {
        RuleFor(command => command.OrderRequestId)
            .NotEmpty();
    }
}
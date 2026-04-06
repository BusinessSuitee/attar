using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.OrderRequests.UpdateOrderRequestStatus;

public sealed class UpdateOrderRequestStatusCommandHandler(IOrderRequestRepository orderRequestRepository)
    : IRequestHandler<UpdateOrderRequestStatusCommand, Result>
{
    public async Task<Result> Handle(UpdateOrderRequestStatusCommand command, CancellationToken cancellationToken)
    {
        var updated = await orderRequestRepository.UpdateStatusAsync(
            command.OrderRequestId,
            command.Status,
            cancellationToken);

        if (!updated)
        {
            return Result.Failure(Error.NotFound(
                "OrderRequests.NotFound",
                $"Order request with id '{command.OrderRequestId}' was not found."));
        }

        return Result.Success();
    }
}

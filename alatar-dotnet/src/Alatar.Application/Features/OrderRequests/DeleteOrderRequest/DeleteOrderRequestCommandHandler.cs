using Alatar.Application.Abstractions.Persistence;
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.OrderRequests.DeleteOrderRequest;

public sealed class DeleteOrderRequestCommandHandler(IOrderRequestRepository orderRequestRepository)
    : IRequestHandler<DeleteOrderRequestCommand, Result>
{
    public async Task<Result> Handle(DeleteOrderRequestCommand command, CancellationToken cancellationToken)
    {
        var deleted = await orderRequestRepository.SoftDeleteAsync(command.OrderRequestId, cancellationToken);

        if (!deleted)
        {
            return Result.Failure(Error.NotFound(
                "OrderRequests.NotFound",
                $"Order request with id '{command.OrderRequestId}' was not found."));
        }

        return Result.Success();
    }
}
using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.OrderRequests.AddOrderRequest;

public sealed record AddOrderRequestCommand(
    Guid ProductId,
    string? SelectedVariety,
    string? SelectedPackaging,
    string? SelectedWeight,
    string? SelectedSize,
    string? SelectedGrade,
    string RequesterName,
    string PhoneNumber,
    decimal QuantityTons) : IRequest<Result<Guid>>;

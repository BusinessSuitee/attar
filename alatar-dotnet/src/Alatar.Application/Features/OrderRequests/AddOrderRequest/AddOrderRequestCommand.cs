using Alatar.Application.Common.Results;
using MediatR;

namespace Alatar.Application.Features.OrderRequests.AddOrderRequest;

public sealed record AddOrderRequestCommand(
    Guid ProductId,
    IReadOnlyCollection<string>? SelectedVarieties,
    IReadOnlyCollection<string>? SelectedPackagingOptions,
    IReadOnlyCollection<string>? SelectedWeightOptions,
    IReadOnlyCollection<string>? SelectedSizeOptions,
    IReadOnlyCollection<string>? SelectedGradeOptions,
    string? SpecialSpecification,
    string RequesterName,
    string PhoneNumber,
    decimal QuantityTons) : IRequest<Result<Guid>>;

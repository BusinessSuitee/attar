using Alatar.Application.Common.Results;
using Microsoft.AspNetCore.Mvc;

namespace Alatar.Api.Common;

public static class ApiResultExtensions
{
    public static IActionResult ToActionResult<TValue>(
        this ControllerBase controller,
        Result<TValue> result,
        Func<TValue, IActionResult> onSuccess)
    {
        if (result.IsSuccess)
        {
            return onSuccess(result.Value!);
        }

        return controller.ToErrorResult(result.Error);
    }

    public static IActionResult ToActionResult(this ControllerBase controller, Result result)
    {
        if (result.IsSuccess)
        {
            return controller.NoContent();
        }

        return controller.ToErrorResult(result.Error);
    }

    public static IActionResult ToErrorResult(this ControllerBase controller, Error error)
    {
        var statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError
        };

        return controller.Problem(
            statusCode: statusCode,
            title: error.Code,
            detail: error.Message);
    }
}

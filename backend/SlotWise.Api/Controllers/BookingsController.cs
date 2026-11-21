using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SlotWise.Api.Dtos;
using SlotWise.Api.Services;

namespace SlotWise.Api.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController(BookingService bookings) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpPost]
    public async Task<IActionResult> Create(CreateBookingRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Purpose) || request.Purpose.Length > 300)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Bad Request",
                detail: "Purpose is required (maximum 300 characters).");
        return Ok(new ApiResponse<BookingResponse>(true, "Booking created successfully.",
            await bookings.CreateAsync(UserId, request, ct)));
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct) =>
        Ok(new ApiResponse<IReadOnlyList<BookingResponse>>(true, "Bookings retrieved successfully.",
            await bookings.ForUserAsync(UserId, ct)));

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> All(CancellationToken ct) =>
        Ok(new ApiResponse<IReadOnlyList<BookingResponse>>(true, "Bookings retrieved successfully.",
            await bookings.AllAsync(ct)));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        await bookings.CancelAsync(id, UserId, User.IsInRole("Admin"), ct);
        return NoContent();
    }

    [HttpGet("availability")]
    public async Task<IActionResult> Availability([FromQuery] int resourceId, [FromQuery] DateTimeOffset start,
        [FromQuery] DateTimeOffset end, CancellationToken ct)
    {
        var available = await bookings.IsAvailableAsync(resourceId, start, end, ct);
        return Ok(new ApiResponse<AvailabilityResponse>(true, "Availability checked successfully.",
            new AvailabilityResponse(resourceId, start.UtcDateTime, end.UtcDateTime, available)));
    }

    [HttpGet("availability/resources")]
    public async Task<IActionResult> AvailableResources([FromQuery] DateTimeOffset start,
        [FromQuery] DateTimeOffset end, CancellationToken ct)
    {
        var resourceIds = await bookings.AvailableResourceIdsAsync(start, end, ct);
        var data = new AvailableResourcesResponse(start.ToUniversalTime(), end.ToUniversalTime(), resourceIds);
        return Ok(new ApiResponse<AvailableResourcesResponse>(true, "Available resources retrieved successfully.", data));
    }
}

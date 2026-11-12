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
            return BadRequest(new { message = "Purpose is required (maximum 300 characters)." });
        try { return Ok(await bookings.CreateAsync(UserId, request, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct) => Ok(await bookings.ForUserAsync(UserId, ct));

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> All(CancellationToken ct) => Ok(await bookings.AllAsync(ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        try
        {
            await bookings.CancelAsync(id, UserId, User.IsInRole("Admin"), ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("availability")]
    public async Task<IActionResult> Availability([FromQuery] int resourceId, [FromQuery] DateTimeOffset start,
        [FromQuery] DateTimeOffset end, CancellationToken ct)
    {
        try
        {
            var available = await bookings.IsAvailableAsync(resourceId, start, end, ct);
            return Ok(new AvailabilityResponse(resourceId, start.UtcDateTime, end.UtcDateTime, available));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException) { return NotFound(new { message = "Resource not found or inactive." }); }
    }

    [HttpGet("availability/resources")]
    public async Task<IActionResult> AvailableResources([FromQuery] DateTimeOffset start,
        [FromQuery] DateTimeOffset end, CancellationToken ct)
    {
        try
        {
            var resourceIds = await bookings.AvailableResourceIdsAsync(start, end, ct);
            return Ok(new { startUtc = start.UtcDateTime, endUtc = end.UtcDateTime, resourceIds });
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }
}

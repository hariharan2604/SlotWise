using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SlotWise.Api.Dtos;
using SlotWise.Api.Services;

namespace SlotWise.Api.Controllers;

[ApiController]
[Route("api/office-locations")]
[Authorize]
public sealed class OfficeLocationsController(IOfficeLocationService offices) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<OfficeLocationResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var includeInactive = User.IsInRole("Admin");
        var locations = await offices.GetAllAsync(includeInactive, cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<OfficeLocationResponse>>(
            true, "Office locations retrieved successfully.", locations));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<OfficeLocationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var location = await offices.GetByIdAsync(id, User.IsInRole("Admin"), cancellationToken);
        return location is null
            ? NotFound()
            : Ok(new ApiResponse<OfficeLocationResponse>(true, "Office location retrieved successfully.", location));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<OfficeLocationResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        CreateOfficeLocationRequest request,
        CancellationToken cancellationToken)
    {
        var location = await offices.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = location.Id },
            new ApiResponse<OfficeLocationResponse>(true, "Office location created successfully.", location));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<OfficeLocationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        UpdateOfficeLocationRequest request,
        CancellationToken cancellationToken)
    {
        var location = await offices.UpdateAsync(id, request, cancellationToken);
        return Ok(new ApiResponse<OfficeLocationResponse>(true, "Office location updated successfully.", location));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        await offices.DeactivateAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:int}/resources")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ResourceResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Resources(int id, CancellationToken cancellationToken)
    {
        var resources = await offices.GetResourcesAsync(id, cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<ResourceResponse>>(
            true, "Office resources retrieved successfully.", resources));
    }

    [HttpGet("{id:int}/resources/availability")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<OfficeResourceAvailabilityResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Availability(
        int id,
        [FromQuery] DateTimeOffset start,
        [FromQuery] DateTimeOffset end,
        CancellationToken cancellationToken)
    {
        var resources = await offices.GetAvailabilityAsync(id, start, end, cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<OfficeResourceAvailabilityResponse>>(
            true, "Office resource availability retrieved successfully.", resources));
    }
}

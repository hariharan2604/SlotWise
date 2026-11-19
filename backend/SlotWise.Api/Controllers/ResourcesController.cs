using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlotWise.Api.Data;
using SlotWise.Api.Dtos;
using SlotWise.Api.Models;

namespace SlotWise.Api.Controllers;

[ApiController]
[Route("api/resources")]
[Authorize]
public class ResourcesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var data = await db.Resources.AsNoTracking().Where(r => r.IsActive).OrderBy(r => r.Name)
            .Select(r => new ResourceResponse(r.Id, r.Name, r.Description, r.Location, r.Capacity, r.IsActive))
            .ToListAsync(ct);
        return Ok(new ApiResponse<IReadOnlyList<ResourceResponse>>(true, "Resources retrieved successfully.", data));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(ResourceRequest request, CancellationToken ct)
    {
        var name = request.Name?.Trim();
        var description = request.Description?.Trim() ?? "";
        var location = request.Location?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(name) || name.Length > 120)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Bad Request",
                detail: "A resource name is required (maximum 120 characters).");
        if (description.Length > 500)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Bad Request",
                detail: "Description cannot exceed 500 characters.");
        if (location.Length > 150)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Bad Request",
                detail: "Location cannot exceed 150 characters.");
        if (request.Capacity < 1)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Bad Request",
                detail: "Capacity must be a positive number.");
        var resource = new Resource { Name = name, Description = description, Location = location, Capacity = request.Capacity };
        db.Resources.Add(resource);
        await db.SaveChangesAsync(ct);
        var response = new ResourceResponse(resource.Id, resource.Name, resource.Description, resource.Location, resource.Capacity, resource.IsActive);
        return Created("/api/resources",
            new ApiResponse<ResourceResponse>(true, "Resource created successfully.", response));
    }
}

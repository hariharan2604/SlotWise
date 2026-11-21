using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SlotWise.Api.Dtos;
using SlotWise.Api.Services;

namespace SlotWise.Api.Controllers;

[ApiController]
[Route("api/resources")]
[Authorize]
public class ResourcesController(IResourceService resources) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var data = await resources.GetActiveAsync(cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<ResourceResponse>>(true, "Resources retrieved successfully.", data));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(ResourceRequest request, CancellationToken cancellationToken)
    {
        var response = await resources.CreateAsync(request, cancellationToken);
        return Created("/api/resources",
            new ApiResponse<ResourceResponse>(true, "Resource created successfully.", response));
    }
}

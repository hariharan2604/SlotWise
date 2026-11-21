using SlotWise.Api.Data.Repositories;
using SlotWise.Api.Dtos;
using SlotWise.Api.Models;

namespace SlotWise.Api.Services;

public sealed class ResourceService(IResourceRepository resources) : IResourceService
{
    public async Task<IReadOnlyList<ResourceResponse>> GetActiveAsync(CancellationToken cancellationToken)
    {
        var resourcesList = await resources.GetActiveAsync(cancellationToken);
        return resourcesList
            .Select(resource => new ResourceResponse(
                resource.Id,
                resource.Name,
                resource.Description,
                resource.Location,
                resource.Capacity,
                resource.IsActive))
            .ToList();
    }

    public async Task<ResourceResponse> CreateAsync(
        ResourceRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name?.Trim();
        var description = request.Description?.Trim() ?? "";
        var location = request.Location?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(name) || name.Length > 120)
            throw new ArgumentException("A resource name is required (maximum 120 characters).");
        if (description.Length > 500)
            throw new ArgumentException("Description cannot exceed 500 characters.");
        if (location.Length > 150)
            throw new ArgumentException("Location cannot exceed 150 characters.");
        if (request.Capacity < 1)
            throw new ArgumentException("Capacity must be a positive number.");

        var resource = new Resource
        {
            Name = name,
            Description = description,
            Location = location,
            Capacity = request.Capacity
        };
        await resources.AddAsync(resource, cancellationToken);

        return new ResourceResponse(
            resource.Id,
            resource.Name,
            resource.Description,
            resource.Location,
            resource.Capacity,
            resource.IsActive);
    }
}

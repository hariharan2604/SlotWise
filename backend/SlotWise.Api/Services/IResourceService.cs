using SlotWise.Api.Dtos;

namespace SlotWise.Api.Services;

public interface IResourceService
{
    Task<IReadOnlyList<ResourceResponse>> GetActiveAsync(CancellationToken cancellationToken);
    Task<ResourceResponse> CreateAsync(ResourceRequest request, CancellationToken cancellationToken);
}

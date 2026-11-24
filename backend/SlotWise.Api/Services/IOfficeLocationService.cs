using SlotWise.Api.Dtos;

namespace SlotWise.Api.Services;

public interface IOfficeLocationService
{
    Task<IReadOnlyList<OfficeLocationResponse>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken);
    Task<OfficeLocationResponse?> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken);
    Task<IReadOnlyList<ResourceResponse>> GetResourcesAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<OfficeResourceAvailabilityResponse>> GetAvailabilityAsync(
        int id, DateTimeOffset start, DateTimeOffset end, CancellationToken cancellationToken);
    Task<OfficeLocationResponse> CreateAsync(CreateOfficeLocationRequest request, CancellationToken cancellationToken);
    Task<OfficeLocationResponse> UpdateAsync(int id, UpdateOfficeLocationRequest request, CancellationToken cancellationToken);
    Task DeactivateAsync(int id, CancellationToken cancellationToken);
}

using SlotWise.Api.Data.Repositories;
using SlotWise.Api.Dtos;
using SlotWise.Api.Models;

namespace SlotWise.Api.Services;

public sealed class OfficeLocationService(
    IOfficeLocationRepository offices,
    IBookingService bookings) : IOfficeLocationService
{
    public async Task<IReadOnlyList<OfficeLocationResponse>> GetAllAsync(
        bool includeInactive,
        CancellationToken cancellationToken)
    {
        var results = await offices.GetAllAsync(includeInactive, cancellationToken);
        return results.Select(ToResponse).ToList();
    }

    public async Task<OfficeLocationResponse?> GetByIdAsync(
        int id,
        bool includeInactive,
        CancellationToken cancellationToken)
    {
        var office = await offices.GetByIdAsync(id, cancellationToken);
        return office is null || (!includeInactive && !office.IsActive) ? null : ToResponse(office);
    }

    public async Task<IReadOnlyList<ResourceResponse>> GetResourcesAsync(
        int id,
        CancellationToken cancellationToken)
    {
        await GetRequiredActiveOfficeAsync(id, cancellationToken);
        var resources = await offices.GetActiveResourcesAsync(id, cancellationToken);
        return resources.Select(ToResourceResponse).ToList();
    }

    public async Task<IReadOnlyList<OfficeResourceAvailabilityResponse>> GetAvailabilityAsync(
        int id,
        DateTimeOffset start,
        DateTimeOffset end,
        CancellationToken cancellationToken)
    {
        await GetRequiredActiveOfficeAsync(id, cancellationToken);
        var resources = await offices.GetActiveResourcesAsync(id, cancellationToken);
        var availableIds = (await bookings.AvailableResourceIdsAsync(start, end, cancellationToken)).ToHashSet();
        return resources.Select(resource =>
            new OfficeResourceAvailabilityResponse(ToResourceResponse(resource), availableIds.Contains(resource.Id)))
            .ToList();
    }

    public async Task<OfficeLocationResponse> CreateAsync(
        CreateOfficeLocationRequest request,
        CancellationToken cancellationToken)
    {
        Validate(request.Name, request.Address, request.City, request.Country, request.Latitude, request.Longitude);
        var office = new OfficeLocation
        {
            Name = request.Name.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            State = NormalizeOptional(request.State),
            Country = request.Country.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Description = NormalizeOptional(request.Description)
        };
        await offices.AddAsync(office, cancellationToken);
        return ToResponse(office);
    }

    public async Task<OfficeLocationResponse> UpdateAsync(
        int id,
        UpdateOfficeLocationRequest request,
        CancellationToken cancellationToken)
    {
        Validate(request.Name, request.Address, request.City, request.Country, request.Latitude, request.Longitude);
        var office = await offices.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Office location not found.");
        office.Name = request.Name.Trim();
        office.Address = request.Address.Trim();
        office.City = request.City.Trim();
        office.State = NormalizeOptional(request.State);
        office.Country = request.Country.Trim();
        office.Latitude = request.Latitude;
        office.Longitude = request.Longitude;
        office.Description = NormalizeOptional(request.Description);
        office.IsActive = request.IsActive;
        office.UpdatedAt = DateTime.UtcNow;
        await offices.SaveChangesAsync(cancellationToken);
        return ToResponse(office);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken)
    {
        var office = await offices.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Office location not found.");
        if (!office.IsActive)
            return;
        office.IsActive = false;
        office.UpdatedAt = DateTime.UtcNow;
        await offices.SaveChangesAsync(cancellationToken);
    }

    private async Task GetRequiredActiveOfficeAsync(int id, CancellationToken cancellationToken)
    {
        var office = await offices.GetByIdAsync(id, cancellationToken);
        if (office is null || !office.IsActive)
            throw new KeyNotFoundException("Office location not found.");
    }

    private static void Validate(
        string name,
        string address,
        string city,
        string country,
        decimal latitude,
        decimal longitude)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(address) ||
            string.IsNullOrWhiteSpace(city) || string.IsNullOrWhiteSpace(country))
            throw new ArgumentException("Office name, address, city, and country are required.");
        if (latitude is < -90 or > 90)
            throw new ArgumentException("Latitude must be between -90 and 90.");
        if (longitude is < -180 or > 180)
            throw new ArgumentException("Longitude must be between -180 and 180.");
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static OfficeLocationResponse ToResponse(OfficeLocation office) =>
        new(office.Id, office.Name, office.Address, office.City, office.State, office.Country,
            office.Latitude, office.Longitude, office.Description, office.IsActive,
            new DateTimeOffset(DateTime.SpecifyKind(office.CreatedAt, DateTimeKind.Utc)),
            office.UpdatedAt.HasValue
                ? new DateTimeOffset(DateTime.SpecifyKind(office.UpdatedAt.Value, DateTimeKind.Utc))
                : null,
            office.Resources.Count(resource => resource.IsActive));

    private static ResourceResponse ToResourceResponse(Resource resource) =>
        new(resource.Id, resource.Name, resource.Description, resource.Location,
            resource.Capacity, resource.IsActive, resource.OfficeLocationId);
}

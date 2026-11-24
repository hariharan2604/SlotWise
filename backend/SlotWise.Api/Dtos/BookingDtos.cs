namespace SlotWise.Api.Dtos;

public record CreateBookingRequest(int ResourceId, DateTimeOffset Start, DateTimeOffset End, string Purpose);
public record BookingResponse(int Id, int ResourceId, string ResourceName, string Purpose,
    DateTime StartUtc, DateTime EndUtc, string Status, string BookedBy, string? OfficeLocationName);
public record AvailabilityResponse(int ResourceId, DateTime StartUtc, DateTime EndUtc, bool Available);

/// <summary>Contains the resource identifiers available for a requested time window.</summary>
public sealed record AvailableResourcesResponse(DateTimeOffset StartUtc, DateTimeOffset EndUtc, IReadOnlyList<int> ResourceIds);

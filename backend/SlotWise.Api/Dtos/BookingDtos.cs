namespace SlotWise.Api.Dtos;

public record CreateBookingRequest(int ResourceId, DateTimeOffset Start, DateTimeOffset End, string Purpose);
public record BookingResponse(int Id, int ResourceId, string ResourceName, string Purpose,
    DateTime StartUtc, DateTime EndUtc, string Status, string BookedBy);
public record AvailabilityResponse(int ResourceId, DateTime StartUtc, DateTime EndUtc, bool Available);

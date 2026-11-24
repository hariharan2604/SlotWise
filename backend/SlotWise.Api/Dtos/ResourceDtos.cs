using System.Text.Json.Serialization;
using SlotWise.Api.Models;

namespace SlotWise.Api.Dtos;

public record ResourceRequest(string Name, string Description, string Location, int Capacity, int? OfficeLocationId = null);
public record ResourceResponse(int Id, string Name, string Description, string Location, int Capacity, bool IsActive,
    int? OfficeLocationId = null);

/// <summary>Assigns an existing resource to an active office or removes its office association.</summary>
public sealed record UpdateResourceOfficeRequest(
    int? OfficeLocationId,
    [property: JsonConverter(typeof(JsonStringEnumConverter))]
    ExistingBookingOfficeChange? ExistingBookingsAction);

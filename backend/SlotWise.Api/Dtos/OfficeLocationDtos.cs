using System.ComponentModel.DataAnnotations;

namespace SlotWise.Api.Dtos;

/// <summary>Payload for creating an office location.</summary>
public sealed record CreateOfficeLocationRequest
{
    [Required, StringLength(120)]
    public required string Name { get; init; }

    [Required, StringLength(250)]
    public required string Address { get; init; }

    [Required, StringLength(120)]
    public required string City { get; init; }

    [StringLength(120)]
    public string? State { get; init; }

    [Required, StringLength(120)]
    public required string Country { get; init; }

    [Range(typeof(decimal), "-90", "90")]
    public required decimal Latitude { get; init; }

    [Range(typeof(decimal), "-180", "180")]
    public required decimal Longitude { get; init; }

    [StringLength(1000)]
    public string? Description { get; init; }
}

/// <summary>Payload for updating an office location.</summary>
public sealed record UpdateOfficeLocationRequest
{
    [Required, StringLength(120)]
    public required string Name { get; init; }

    [Required, StringLength(250)]
    public required string Address { get; init; }

    [Required, StringLength(120)]
    public required string City { get; init; }

    [StringLength(120)]
    public string? State { get; init; }

    [Required, StringLength(120)]
    public required string Country { get; init; }

    [Range(typeof(decimal), "-90", "90")]
    public required decimal Latitude { get; init; }

    [Range(typeof(decimal), "-180", "180")]
    public required decimal Longitude { get; init; }

    [StringLength(1000)]
    public string? Description { get; init; }

    public bool IsActive { get; init; } = true;
}

/// <summary>Office location details and its active resource count.</summary>
public sealed record OfficeLocationResponse(
    int Id,
    string Name,
    string Address,
    string City,
    string? State,
    string Country,
    decimal Latitude,
    decimal Longitude,
    string? Description,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    int ResourceCount);

/// <summary>Resource details and availability for a selected office and time window.</summary>
public sealed record OfficeResourceAvailabilityResponse(ResourceResponse Resource, bool Available);

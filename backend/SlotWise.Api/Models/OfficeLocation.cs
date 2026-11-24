namespace SlotWise.Api.Models;

public class OfficeLocation
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string? State { get; set; }
    public string Country { get; set; } = "";
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<Resource> Resources { get; set; } = new List<Resource>();
}

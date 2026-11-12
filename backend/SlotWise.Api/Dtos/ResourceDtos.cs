namespace SlotWise.Api.Dtos;

public record ResourceRequest(string Name, string Description, string Location, int Capacity);
public record ResourceResponse(int Id, string Name, string Description, string Location, int Capacity, bool IsActive);

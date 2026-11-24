using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SlotWise.Api.Models;

namespace SlotWise.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<OfficeLocation> OfficeLocations => Set<OfficeLocation>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<Resource>().Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Entity<Resource>().Property(x => x.Description).HasMaxLength(500);
        builder.Entity<Resource>().Property(x => x.Location).HasMaxLength(150);
        builder.Entity<Resource>().HasIndex(x => x.OfficeLocationId);
        builder.Entity<Resource>().HasOne(x => x.OfficeLocation).WithMany(x => x.Resources)
            .HasForeignKey(x => x.OfficeLocationId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<OfficeLocation>().Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Entity<OfficeLocation>().Property(x => x.Address).HasMaxLength(250).IsRequired();
        builder.Entity<OfficeLocation>().Property(x => x.City).HasMaxLength(120).IsRequired();
        builder.Entity<OfficeLocation>().Property(x => x.State).HasMaxLength(120);
        builder.Entity<OfficeLocation>().Property(x => x.Country).HasMaxLength(120).IsRequired();
        builder.Entity<OfficeLocation>().Property(x => x.Description).HasMaxLength(1000);
        builder.Entity<OfficeLocation>().Property(x => x.Latitude).HasPrecision(9, 6);
        builder.Entity<OfficeLocation>().Property(x => x.Longitude).HasPrecision(9, 6);
        builder.Entity<OfficeLocation>().HasIndex(x => new { x.IsActive, x.Name });
        builder.Entity<OfficeLocation>().ToTable(table =>
        {
            table.HasCheckConstraint("CK_OfficeLocations_Latitude", "[Latitude] >= -90 AND [Latitude] <= 90");
            table.HasCheckConstraint("CK_OfficeLocations_Longitude", "[Longitude] >= -180 AND [Longitude] <= 180");
        });
        builder.Entity<Booking>().Property(x => x.Purpose).HasMaxLength(300).IsRequired();
        builder.Entity<Booking>().HasIndex(x => new { x.ResourceId, x.StartUtc, x.EndUtc, x.Status });
        builder.Entity<Booking>().HasOne(x => x.Resource).WithMany(x => x.Bookings).HasForeignKey(x => x.ResourceId);
        builder.Entity<Booking>().HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
    }
}

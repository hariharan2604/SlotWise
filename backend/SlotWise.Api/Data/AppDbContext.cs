using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SlotWise.Api.Models;

namespace SlotWise.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<Resource>().Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Entity<Resource>().Property(x => x.Description).HasMaxLength(500);
        builder.Entity<Resource>().Property(x => x.Location).HasMaxLength(150);
        builder.Entity<Booking>().Property(x => x.Purpose).HasMaxLength(300).IsRequired();
        builder.Entity<Booking>().HasIndex(x => new { x.ResourceId, x.StartUtc, x.EndUtc, x.Status });
        builder.Entity<Booking>().HasOne(x => x.Resource).WithMany(x => x.Bookings).HasForeignKey(x => x.ResourceId);
        builder.Entity<Booking>().HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
    }
}

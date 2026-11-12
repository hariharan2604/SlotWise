using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SlotWise.Api.Data;
using SlotWise.Api.Models;
using SlotWise.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is missing.");
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = false;
    options.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<AppDbContext>()
.AddSignInManager();

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddScoped<BookingService>();
var frontendOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173"
};
if (builder.Environment.IsDevelopment())
{
    frontendOrigins.Add("http://localhost:5173");
    frontendOrigins.Add("http://127.0.0.1:5173");
}
builder.Services.AddCors(options => options.AddPolicy("frontend", p =>
    p.WithOrigins(frontendOrigins.ToArray()).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Development convenience: create schema and seed roles/resources.
// For production, use reviewed EF Core migrations instead of EnsureCreated.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var role in new[] { "Admin", "User" })
        if (!await roles.RoleExistsAsync(role)) await roles.CreateAsync(new IdentityRole(role));

    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var adminEmail = config["SeedAdmin:Email"];
    var adminPassword = config["SeedAdmin:Password"];
    if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrWhiteSpace(adminPassword))
    {
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var admin = await users.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new ApplicationUser { UserName = adminEmail, Email = adminEmail, DisplayName = "SlotWise Admin", EmailConfirmed = true };
            var result = await users.CreateAsync(admin, adminPassword);
            if (result.Succeeded) await users.AddToRoleAsync(admin, "Admin");
        }
    }

    if (!await db.Resources.AnyAsync())
    {
        db.Resources.AddRange(
            new Resource { Name = "Meeting Room A", Description = "8-person meeting room", Location = "First floor", Capacity = 8 },
            new Resource { Name = "Projector 01", Description = "Portable HD projector", Location = "IT Store", Capacity = 1 },
            new Resource { Name = "Conference Room", Description = "Large conference room", Location = "Second floor", Capacity = 16 }
        );
        await db.SaveChangesAsync();
    }
}
app.Run();

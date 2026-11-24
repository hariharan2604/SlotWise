using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SlotWise.Api.Data;
using SlotWise.Api.Data.Repositories;
using SlotWise.Api.Middleware;
using SlotWise.Api.Models;
using SlotWise.Api.Security;
using SlotWise.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Instance ??= context.HttpContext.Request.Path;
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
    };
});

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
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrEmpty(context.Token))
                    context.Token = context.Request.Cookies[AuthCookieDefaults.Name];
                return Task.CompletedTask;
            }
        };
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
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IResourceRepository, ResourceRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IResourceService, ResourceService>();
builder.Services.AddScoped<IOfficeLocationRepository, OfficeLocationRepository>();
builder.Services.AddScoped<IOfficeLocationService, OfficeLocationService>();
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
    p.WithOrigins(frontendOrigins.ToArray()).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();
app.UseExceptionHandler();
app.UseStatusCodePages();
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
    await db.Database.ExecuteSqlRawAsync("""
        IF OBJECT_ID(N'[dbo].[OfficeLocations]', N'U') IS NULL
        BEGIN
            CREATE TABLE [dbo].[OfficeLocations] (
                [Id] int NOT NULL IDENTITY,
                [Name] nvarchar(120) NOT NULL,
                [Address] nvarchar(250) NOT NULL,
                [City] nvarchar(120) NOT NULL,
                [State] nvarchar(120) NULL,
                [Country] nvarchar(120) NOT NULL,
                [Latitude] decimal(9,6) NOT NULL,
                [Longitude] decimal(9,6) NOT NULL,
                [Description] nvarchar(1000) NULL,
                [IsActive] bit NOT NULL,
                [CreatedAt] datetime2 NOT NULL,
                [UpdatedAt] datetime2 NULL,
                CONSTRAINT [PK_OfficeLocations] PRIMARY KEY ([Id]),
                CONSTRAINT [CK_OfficeLocations_Latitude] CHECK ([Latitude] >= -90 AND [Latitude] <= 90),
                CONSTRAINT [CK_OfficeLocations_Longitude] CHECK ([Longitude] >= -180 AND [Longitude] <= 180)
            );
            CREATE INDEX [IX_OfficeLocations_IsActive_Name] ON [dbo].[OfficeLocations] ([IsActive], [Name]);
        END;

        IF COL_LENGTH(N'[dbo].[Resources]', N'OfficeLocationId') IS NULL
            ALTER TABLE [dbo].[Resources] ADD [OfficeLocationId] int NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.foreign_keys
            WHERE name = N'FK_Resources_OfficeLocations_OfficeLocationId'
        )
        BEGIN
            ALTER TABLE [dbo].[Resources]
            ADD CONSTRAINT [FK_Resources_OfficeLocations_OfficeLocationId]
            FOREIGN KEY ([OfficeLocationId]) REFERENCES [dbo].[OfficeLocations] ([Id])
            ON DELETE NO ACTION;
        END;

        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = N'IX_Resources_OfficeLocationId' AND object_id = OBJECT_ID(N'[dbo].[Resources]')
        )
            CREATE INDEX [IX_Resources_OfficeLocationId]
            ON [dbo].[Resources] ([OfficeLocationId]);
        """);
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
            admin = new ApplicationUser { UserName = adminEmail, Email = adminEmail, DisplayName = "Admin", EmailConfirmed = true };
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

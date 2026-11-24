SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.Resources', N'U') IS NULL
    THROW 51000, 'The existing SlotWise Resources table was not found.', 1;

BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.OfficeLocations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OfficeLocations
    (
        Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_OfficeLocations PRIMARY KEY,
        Name nvarchar(120) NOT NULL,
        Address nvarchar(250) NOT NULL,
        City nvarchar(120) NOT NULL,
        State nvarchar(120) NULL,
        Country nvarchar(120) NOT NULL,
        Latitude decimal(9,6) NOT NULL,
        Longitude decimal(9,6) NOT NULL,
        Description nvarchar(1000) NULL,
        IsActive bit NOT NULL,
        CreatedAt datetime2 NOT NULL,
        UpdatedAt datetime2 NULL,
        CONSTRAINT CK_OfficeLocations_Latitude CHECK (Latitude >= -90 AND Latitude <= 90),
        CONSTRAINT CK_OfficeLocations_Longitude CHECK (Longitude >= -180 AND Longitude <= 180)
    );
END;

IF COL_LENGTH(N'dbo.Resources', N'OfficeLocationId') IS NULL
    ALTER TABLE dbo.Resources ADD OfficeLocationId int NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Resources_OfficeLocations_OfficeLocationId')
    ALTER TABLE dbo.Resources WITH CHECK
        ADD CONSTRAINT FK_Resources_OfficeLocations_OfficeLocationId
        FOREIGN KEY (OfficeLocationId) REFERENCES dbo.OfficeLocations (Id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Resources_OfficeLocationId' AND object_id = OBJECT_ID(N'dbo.Resources'))
    CREATE INDEX IX_Resources_OfficeLocationId ON dbo.Resources (OfficeLocationId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_OfficeLocations_IsActive_Name' AND object_id = OBJECT_ID(N'dbo.OfficeLocations'))
    CREATE INDEX IX_OfficeLocations_IsActive_Name ON dbo.OfficeLocations (IsActive, Name);

IF OBJECT_ID(N'dbo.__EFMigrationsHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.__EFMigrationsHistory
    (
        MigrationId nvarchar(150) NOT NULL CONSTRAINT PK___EFMigrationsHistory PRIMARY KEY,
        ProductVersion nvarchar(32) NOT NULL
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.__EFMigrationsHistory WHERE MigrationId = N'20261124050404_InitialCreate')
    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES (N'20261124050404_InitialCreate', N'10.0.0');

COMMIT TRANSACTION;

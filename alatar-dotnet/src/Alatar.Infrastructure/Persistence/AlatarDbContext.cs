using Alatar.Application.Abstractions.Persistence;
using Alatar.Domain.Categories;
using Alatar.Domain.Contacts;
using Alatar.Domain.Products;
using Microsoft.EntityFrameworkCore;

namespace Alatar.Infrastructure.Persistence;

public sealed class AlatarDbContext(DbContextOptions<AlatarDbContext> options)
    : DbContext(options), IAlatarDbContext
{
    public IQueryable<Category> Categories => Set<Category>();
    public IQueryable<ContactLead> Contacts => Set<ContactLead>();
    public IQueryable<Product> Products => Set<Product>();

    public async Task AddCategoryAsync(Category category, CancellationToken cancellationToken)
    {
        await Set<Category>().AddAsync(category, cancellationToken);
    }

    public async Task AddContactAsync(ContactLead contactLead, CancellationToken cancellationToken)
    {
        await Set<ContactLead>().AddAsync(contactLead, cancellationToken);
    }

    public async Task AddProductAsync(Product product, CancellationToken cancellationToken)
    {
        await Set<Product>().AddAsync(product, cancellationToken);
    }

    public void RemoveContact(ContactLead contactLead)
    {
        Set<ContactLead>().Remove(contactLead);
    }

    public void RemoveCategory(Category category)
    {
        Set<Category>().Remove(category);
    }

    public void RemoveProduct(Product product)
    {
        Set<Product>().Remove(product);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var category = modelBuilder.Entity<Category>();

        category.ToTable("Categories");
        category.HasKey(x => x.Id);

        category.Property(x => x.Id)
            .ValueGeneratedNever();

        category.Property(x => x.Name)
            .HasMaxLength(120)
            .IsRequired();

        category.Property(x => x.NormalizedName)
            .HasMaxLength(120)
            .IsRequired();

        category.HasIndex(x => x.NormalizedName)
            .IsUnique();

        category.Property(x => x.CreatedAtUtc)
            .IsRequired();

        var contact = modelBuilder.Entity<ContactLead>();

        contact.ToTable("Contacts");
        contact.HasKey(x => x.Id);

        contact.Property(x => x.Id)
            .ValueGeneratedNever();

        contact.Property(x => x.FullName)
            .HasMaxLength(200)
            .IsRequired();

        contact.Property(x => x.PhoneNumber)
            .HasMaxLength(64)
            .IsRequired();

        contact.Property(x => x.ServiceType)
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();

        contact.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        contact.Property(x => x.CompanyName)
            .HasMaxLength(200);

        contact.Property(x => x.Country)
            .HasMaxLength(128);

        contact.Property(x => x.Crop)
            .HasMaxLength(128);

        contact.Property(x => x.QuantityTons)
            .HasPrecision(18, 2);

        contact.Property(x => x.DeliveryWindow)
            .HasMaxLength(128);

        contact.Property(x => x.Notes)
            .HasMaxLength(2000);

        contact.Property(x => x.CreatedAtUtc)
            .IsRequired();

        var product = modelBuilder.Entity<Product>();

        product.ToTable("Products");
        product.HasKey(x => x.Id);

        product.Property(x => x.Id)
            .ValueGeneratedNever();

        product.Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        product.Property(x => x.Sku)
            .HasMaxLength(64)
            .IsRequired();

        product.HasIndex(x => x.Sku)
            .IsUnique();

        product.Property(x => x.Price)
            .HasPrecision(18, 2);

        product.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        product.Property(x => x.StockQuantity)
            .IsRequired();

        product.Property(x => x.CreatedAtUtc)
            .IsRequired();

        product.Property(x => x.UpdatedAtUtc)
            .IsRequired();
    }
}

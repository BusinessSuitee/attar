using Alatar.Application.Abstractions.Persistence;
using Alatar.Domain.Categories;
using Alatar.Domain.Contacts;
using Alatar.Domain.OrderRequests;
using Alatar.Domain.Products;
using Microsoft.EntityFrameworkCore;

namespace Alatar.Infrastructure.Persistence;

public sealed class AlatarDbContext(DbContextOptions<AlatarDbContext> options)
    : DbContext(options), IAlatarDbContext
{
    public IQueryable<Category> Categories => Set<Category>();
    public IQueryable<ContactLead> Contacts => Set<ContactLead>();
    public IQueryable<OrderRequest> OrderRequests => Set<OrderRequest>();
    public IQueryable<Product> Products => Set<Product>();
    public IQueryable<ProductImage> ProductImages => Set<ProductImage>();

    public async Task AddCategoryAsync(Category category, CancellationToken cancellationToken)
    {
        await Set<Category>().AddAsync(category, cancellationToken);
    }

    public async Task AddContactAsync(ContactLead contactLead, CancellationToken cancellationToken)
    {
        await Set<ContactLead>().AddAsync(contactLead, cancellationToken);
    }

    public async Task AddOrderRequestAsync(OrderRequest orderRequest, CancellationToken cancellationToken)
    {
        await Set<OrderRequest>().AddAsync(orderRequest, cancellationToken);
    }

    public async Task AddProductAsync(Product product, CancellationToken cancellationToken)
    {
        await Set<Product>().AddAsync(product, cancellationToken);
    }

    public async Task AddProductImageAsync(ProductImage image, CancellationToken cancellationToken)
    {
        await Set<ProductImage>().AddAsync(image, cancellationToken);
    }

    public void RemoveContact(ContactLead contactLead)
    {
        Set<ContactLead>().Remove(contactLead);
    }

    public void RemoveOrderRequest(OrderRequest orderRequest)
    {
        Set<OrderRequest>().Remove(orderRequest);
    }

    public void RemoveCategory(Category category)
    {
        Set<Category>().Remove(category);
    }

    public void RemoveProduct(Product product)
    {
        Set<Product>().Remove(product);
    }

    public void RemoveProductImage(ProductImage image)
    {
        Set<ProductImage>().Remove(image);
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

        category.Property(x => x.Type)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        category.Property(x => x.Season)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

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

        var orderRequest = modelBuilder.Entity<OrderRequest>();

        orderRequest.ToTable("OrderRequests");
        orderRequest.HasKey(x => x.Id);

        orderRequest.Property(x => x.Id)
            .ValueGeneratedNever();

        orderRequest.Property(x => x.ProductId)
            .IsRequired();

        orderRequest.Property(x => x.ProductNameSnapshot)
            .HasMaxLength(220)
            .IsRequired();

        orderRequest.Property(x => x.RequesterName)
            .HasMaxLength(200)
            .IsRequired();

        orderRequest.Property(x => x.PhoneNumber)
            .HasMaxLength(64)
            .IsRequired();

        orderRequest.Property(x => x.QuantityTons)
            .HasPrecision(18, 2)
            .IsRequired();

        orderRequest.Property(x => x.SelectedVariety)
            .HasMaxLength(120);

        orderRequest.Property(x => x.SelectedPackaging)
            .HasMaxLength(120);

        orderRequest.Property(x => x.SelectedWeight)
            .HasMaxLength(120);

        orderRequest.Property(x => x.SelectedSize)
            .HasMaxLength(120);

        orderRequest.Property(x => x.SelectedGrade)
            .HasMaxLength(120);

        orderRequest.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        orderRequest.Property(x => x.CreatedAtUtc)
            .IsRequired();

        orderRequest.Property(x => x.UpdatedAtUtc)
            .IsRequired();

        orderRequest.HasIndex(x => x.ProductId);
        orderRequest.HasIndex(x => x.Status);
        orderRequest.HasIndex(x => x.CreatedAtUtc);

        orderRequest.HasOne<Product>()
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        var product = modelBuilder.Entity<Product>();

        product.ToTable("Products");
        product.HasKey(x => x.Id);

        product.Property(x => x.Id)
            .ValueGeneratedNever();

        product.Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        product.Property(x => x.NameAr)
            .HasMaxLength(200)
            .IsRequired();

        product.Property(x => x.Sku)
            .HasMaxLength(64)
            .IsRequired();

        product.HasIndex(x => x.Sku)
            .IsUnique();

        product.Property(x => x.Price)
            .HasPrecision(18, 2);

        product.Property(x => x.DescriptionEn)
            .HasMaxLength(2000)
            .IsRequired();

        product.Property(x => x.DescriptionAr)
            .HasMaxLength(2000)
            .IsRequired();

        product.Property(x => x.ProductType)
            .HasConversion<string>()
            .HasMaxLength(24)
            .IsRequired();

        product.Property(x => x.ProductState)
            .HasConversion<string>()
            .HasMaxLength(24)
            .IsRequired();

        product.Property(x => x.Season)
            .HasConversion<string>()
            .HasMaxLength(24)
            .IsRequired();

        product.Property(x => x.VarietiesJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        product.Property(x => x.PackagingOptionsJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        product.Property(x => x.WeightOptionsJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        product.Property(x => x.SizeOptionsJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();

        product.Property(x => x.GradeOptionsJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();

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

        var productImage = modelBuilder.Entity<ProductImage>();

        productImage.ToTable("ProductImages");
        productImage.HasKey(x => x.Id);

        productImage.Property(x => x.Id)
            .ValueGeneratedNever();

        productImage.Property(x => x.ProductId)
            .IsRequired();

        productImage.Property(x => x.RelativePath)
            .HasMaxLength(500)
            .IsRequired();

        productImage.Property(x => x.DisplayOrder)
            .IsRequired();

        productImage.Property(x => x.CreatedAtUtc)
            .IsRequired();

        productImage.HasIndex(x => x.ProductId);

        productImage.HasOne<Product>()
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

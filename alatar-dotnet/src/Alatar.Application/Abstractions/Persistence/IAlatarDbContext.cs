using Alatar.Domain.Categories;
using Alatar.Domain.Contacts;
using Alatar.Domain.Products;

namespace Alatar.Application.Abstractions.Persistence;

public interface IAlatarDbContext
{
    IQueryable<Category> Categories { get; }
    IQueryable<ContactLead> Contacts { get; }
    IQueryable<Product> Products { get; }
    IQueryable<ProductImage> ProductImages { get; }
    Task AddCategoryAsync(Category category, CancellationToken cancellationToken);
    Task AddContactAsync(ContactLead contactLead, CancellationToken cancellationToken);
    Task AddProductAsync(Product product, CancellationToken cancellationToken);
    Task AddProductImageAsync(ProductImage image, CancellationToken cancellationToken);
    void RemoveCategory(Category category);
    void RemoveContact(ContactLead contactLead);
    void RemoveProduct(Product product);
    void RemoveProductImage(ProductImage image);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

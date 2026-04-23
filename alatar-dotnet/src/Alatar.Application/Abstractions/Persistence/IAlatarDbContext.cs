using Alatar.Domain.Categories;
using Alatar.Domain.Contacts;
using Alatar.Domain.OrderRequests;
using Alatar.Domain.Products;
using Alatar.Domain.SocialLinks;

namespace Alatar.Application.Abstractions.Persistence;

public interface IAlatarDbContext
{
    IQueryable<Category> Categories { get; }
    IQueryable<ContactLead> Contacts { get; }
    IQueryable<OrderRequest> OrderRequests { get; }
    IQueryable<Product> Products { get; }
    IQueryable<ProductImage> ProductImages { get; }
    IQueryable<SocialLink> SocialLinks { get; }
    Task AddCategoryAsync(Category category, CancellationToken cancellationToken);
    Task AddContactAsync(ContactLead contactLead, CancellationToken cancellationToken);
    Task AddOrderRequestAsync(OrderRequest orderRequest, CancellationToken cancellationToken);
    Task AddProductAsync(Product product, CancellationToken cancellationToken);
    Task AddProductImageAsync(ProductImage image, CancellationToken cancellationToken);
    Task AddSocialLinkAsync(SocialLink socialLink, CancellationToken cancellationToken);
    void RemoveCategory(Category category);
    void RemoveContact(ContactLead contactLead);
    void RemoveOrderRequest(OrderRequest orderRequest);
    void RemoveProduct(Product product);
    void RemoveProductImage(ProductImage image);
    void RemoveSocialLink(SocialLink socialLink);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

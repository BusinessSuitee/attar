import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

type ProductFilter = 'winter' | 'summer' | 'vegetables' | 'frozen';
type ProductBadge = 'summer' | 'vegetables';

interface FilterOption {
	id: ProductFilter;
	label: string;
	icon: string;
}

interface ProductCard {
	title: string;
	season: string;
	image: string;
	badge: string;
	badgeType: ProductBadge;
	categories: ProductFilter[];
}

@Component({
	selector: 'app-products-page',
	standalone: true,
	imports: [CommonModule, NavbarComponent],
	templateUrl: './products.page.html',
	styleUrl: './products.page.css',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsPageComponent {
	readonly activeFilter = signal<ProductFilter>('winter');

	readonly filterOptions: FilterOption[] = [
		{ id: 'winter', label: 'المحاصيل الشتوية', icon: 'ac_unit' },
		{ id: 'summer', label: 'المحاصيل الصيفية', icon: 'wb_sunny' },
		{ id: 'vegetables', label: 'الخضروات', icon: 'nutrition' },
		{ id: 'frozen', label: 'منتجات مجمدة', icon: 'severe_cold' }
	];

	readonly products: ProductCard[] = [
		{
			title: 'العنب الفاخر',
			season: 'مايو - أغسطس',
			image:
				'https://lh3.googleusercontent.com/aida-public/AB6AXuDjzxjNfKGW7rmqfJuM2pxOW117GPNATQcvZo0fNRZsFhcPBAwQVW6stwieog_79ypAOy9Qpge--Hi9oDodyVedKxVJEUSJhda3gXatlRodoviKO-jRYMqbCJTBDGxhXpOeMx38hw1ffB_WiF1gBVvydSejBgYcx2Z82VuzfceM-S-TXMOVp_zSeCE127qfwJ2_IMXfbOmHq9RhhujMU-mI96S1NWDnkmH2kGAQBJi9L9YPrtbSqoVk9rMUKHdCNupm8fjZnUad7gY',
			badge: 'موسم صيفي',
			badgeType: 'summer',
			categories: ['summer']
		},
		{
			title: 'المانجو المصرية',
			season: 'يونيو - سبتمبر',
			image:
				'https://lh3.googleusercontent.com/aida-public/AB6AXuBq1eJok6fcxTEYBq1GWtkH2C7nlzJpOzBuTaZpktv4T1QenmbwCi08GfyTYCO-fLecSTSRdN4oJn-XIPH5rWTRn2rb_4-A2zZs-o0lnxEzesR4W_NLvR-DqdTiMpmmWUQRkGe3zfkWhpxmPxCQmuSY1zbwaLCnOD-2cjelG0ztsfUTMoL41b3w9jFJgTBlrnmuDxgYw1EZrBJDb_gHvneZC-WLGxOq8z-VY96NHa3mflbBsSxF8oda7iY36K9D-b0KGd6ZvU5rhyQ',
			badge: 'موسم صيفي',
			badgeType: 'summer',
			categories: ['summer']
		},
		{
			title: 'البطاطس',
			season: 'يناير - مايو',
			image:
				'https://lh3.googleusercontent.com/aida-public/AB6AXuBPdYTFGiP_6CIMLYOUrlCLuaAoSbKpNjNnt5Yy7JZubQtpeOLJh9IlJjLoTuxzs0egOtzea4-tYsN8CoMmestlkSmsqw4qZeKhDASrDTgbicIeTMEtvrRVHZpUErqmBUCP1moW6pNVaR-tZXfH1u699r68QQxP_xwl78zPxVe5FNGozN6mytYewaHHMz9mVQosJ6sfGfmcq3bHMLHR4a9G7uzB9Nb6C6pbFnWbWXEbD6S4zHsfk3uDw4KCdVKweCWRmS9g3wNtk_I',
			badge: 'خضروات',
			badgeType: 'vegetables',
			categories: ['winter', 'vegetables']
		},
		{
			title: 'البصل',
			season: 'أبريل - يوليو',
			image:
				'https://lh3.googleusercontent.com/aida-public/AB6AXuCk68avb3HU4cJ2ad9LpySJ4vCWBtI_teFdcmUb_44wDXaAm2Iaa6fGNQS-xZdDwlwzWdtX_Z6EaiFeHFInXaFYA9vu70XrNGaVUFCS4KhoO8NcNw_NduvLtDw8jBwaUw8l0cJFWmTXTunK0V6VL2d360wWl-2xqSSMDSHtFKgeI0TmlrrXoxoX9SylhFaE2YoQnNgyjkY6Tj8dN092aj4Tlz8rlpZR5BZ7mxUHEgmkFq5zOdWrA1wnKPXoqLcGxt0kR2tInHXKwWY',
			badge: 'خضروات',
			badgeType: 'vegetables',
			categories: ['winter', 'vegetables']
		},
		{
			title: 'الثوم',
			season: 'مارس - أبريل',
			image:
				'https://lh3.googleusercontent.com/aida-public/AB6AXuBmEpV1yVRTStosFtUO_2SOM5jjxxTpWVTgDAbdhlj5yzxGs2raUZKABEYJW8xKM-jUZxhAWbQJFLD026TA9tenrPwc2uxF_Kj8jyC7cU8BwmRaqmLglIfSP_8UVN2aYgr9seGKgoCM9XnkFwz-fn6_0fzk9lB4uZb-gdZTh5xEz52s-CbBuhCZ7sZOGz7lAgEkkTZhCFISoE5YQMNZ338ZP1fTfLeZ8j_GUgl2grlPezLYZS_8oLxl3FOu6dJqVprKYby4mmicpUk',
			badge: 'خضروات',
			badgeType: 'vegetables',
			categories: ['winter', 'vegetables']
		}
	];

	readonly visibleProducts = computed(() =>
		this.products.filter((product) => product.categories.includes(this.activeFilter()))
	);

	setFilter(filter: ProductFilter): void {
		this.activeFilter.set(filter);
	}
}

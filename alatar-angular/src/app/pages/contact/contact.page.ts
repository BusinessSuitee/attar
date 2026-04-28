import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ContactService, ContactUiServiceType } from '../../core/contacts/contact.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, TranslocoModule],
  templateUrl: './contact.page.html',
  styleUrl: './contact.page.css'
})
export class ContactPageComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly contactService = inject(ContactService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);
  private readonly route = inject(ActivatedRoute);

  readonly countries = [
    'egypt',
    'saudi',
    'uae',
    'kuwait',
    'russia',
    'eu'
  ];

  readonly crops = [
    'oranges',
    'grapes',
    'mangoes',
    'strawberries',
    'potatoes',
    'onions',
    'pomegranates'
  ];

  readonly form = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phoneNumber: ['', [Validators.required, Validators.minLength(7)]],
    serviceType: this.formBuilder.control<ContactUiServiceType>('local'),
    companyName: [''],
    country: [''],
    crop: [''],
    quantityTons: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    deliveryWindow: [''],
    notes: ['']
  });

  isSubmitting = false;
  submitError = '';
  submitSuccess = '';

  constructor() {
    this.form.controls.serviceType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((serviceType) => this.applyCountryValidation(serviceType));
  }

  ngOnInit(): void {
    const cropFromQuery = this.route.snapshot.queryParamMap.get('crop');
    if (cropFromQuery && cropFromQuery.trim().length > 0) {
      this.form.patchValue({ crop: cropFromQuery.trim() });
    }
  }

  get isExportSelected(): boolean {
    return this.form.controls.serviceType.value === 'export';
  }

  submit(): void {
    this.submitError = '';
    this.submitSuccess = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const quantityValue = rawValue.quantityTons.trim();
    const quantityTons = quantityValue === '' ? null : Number(quantityValue);

    if (quantityTons !== null && Number.isNaN(quantityTons)) {
      this.submitError = 'err_quantity_pattern';
      return;
    }

    this.isSubmitting = true;

    this.contactService
      .createContact({
        fullName: rawValue.fullName,
        phoneNumber: rawValue.phoneNumber,
        serviceType: rawValue.serviceType,
        companyName: this.normalizeOptionalValue(rawValue.companyName),
        country: this.normalizeOptionalValue(rawValue.country),
        crop: this.normalizeOptionalValue(rawValue.crop),
        quantityTons,
        deliveryWindow: this.normalizeOptionalValue(rawValue.deliveryWindow),
        notes: this.normalizeOptionalValue(rawValue.notes)
      })
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.form.reset({
            fullName: '',
            phoneNumber: '',
            serviceType: 'local',
            companyName: '',
            country: '',
            crop: '',
            quantityTons: '',
            deliveryWindow: '',
            notes: ''
          });

          this.applyCountryValidation('local');
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.submitSuccess = 'msg_success';
        },
        error: () => {
          this.submitError = 'msg_error';
        }
      });
  }

  fieldHasError(controlName: keyof typeof this.form.controls, errorName: string): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(errorName);
  }

  private applyCountryValidation(serviceType: ContactUiServiceType): void {
    const countryControl = this.form.controls.country;

    if (serviceType === 'export') {
      countryControl.setValidators([Validators.required]);
    } else {
      countryControl.setValidators([]);
      countryControl.setValue('', { emitEvent: false });
    }

    countryControl.updateValueAndValidity({ emitEvent: false });
  }

  private normalizeOptionalValue(value: string): string | null {
    const normalized = value.trim();
    return normalized === '' ? null : normalized;
  }
}

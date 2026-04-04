import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.page.html',
  styleUrl: './admin-login.page.css'
})
export class AdminLoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['admin@attar-eg.com', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]]
  });

  isSubmitting = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = this.loginForm.getRawValue();

    this.authService
      .login(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl');
          const safeReturnUrl = returnUrl?.startsWith('/') ? returnUrl : '/admin';

          void this.router.navigateByUrl(safeReturnUrl);
        },
        error: (error: { status?: number }) => {
          if (error?.status === 401) {
            this.errorMessage = 'بيانات الدخول غير صحيحة. حاول مرة أخرى.';
            return;
          }

          this.errorMessage = 'تعذر تسجيل الدخول حاليا. حاول لاحقا.';
        }
      });
  }
}

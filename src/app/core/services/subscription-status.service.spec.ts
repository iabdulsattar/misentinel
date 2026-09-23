import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatusService } from './subscription-status.service';

describe('SubscriptionStatusService', () => {
  let service: SubscriptionStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getUserId: () => of('user-1'),
          },
        },
        {
          provide: SubscriptionService,
          useValue: {
            checkSubscription: () => of({ active: true, status: 'ACTIVE', features: {} }),
          },
        },
      ],
    });

    service = TestBed.inject(SubscriptionStatusService);
  });

  it('marks a successful checkout as active', () => {
    localStorage.clear();

    service.markCheckoutSuccess();

    expect(service.isActive()).toBeTrue();
    expect(JSON.parse(localStorage.getItem('subscribed_services') || '[]')).toContain(
      jasmine.objectContaining({ serviceCode: 'edob', status: 'ACTIVE' })
    );
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatusService } from './subscription-status.service';

describe('SubscriptionStatusService', () => {
  let service: SubscriptionStatusService;
  let mockCheckSubscription: jasmine.Spy;

  beforeEach(() => {
    mockCheckSubscription = jasmine.createSpy('checkSubscription').and.returnValue(
      of({ active: true, status: 'ACTIVE', features: {} })
    );

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
            checkSubscription: mockCheckSubscription,
          },
        },
      ],
    });

    localStorage.clear();
    localStorage.setItem('remember_device', 'true');
    localStorage.setItem('org_id', 'org-1');
    service = TestBed.inject(SubscriptionStatusService);
  });

  it('marks a successful checkout as active', () => {
    service.markCheckoutSuccess();

    expect(service.isActive()).toBeTrue();
  });

  it('treats a trial as still active for access gates', async () => {
    mockCheckSubscription.and.returnValue(of({ active: false, status: 'TRIAL', features: {} }));

    await service.refresh();

    expect(service.status()).toBe('trial');
    expect(service.isActive()).toBeTrue();
  });
});

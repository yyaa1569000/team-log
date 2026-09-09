import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogManagement } from './log-management';

describe('LogManagement', () => {
  let component: LogManagement;
  let fixture: ComponentFixture<LogManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(LogManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

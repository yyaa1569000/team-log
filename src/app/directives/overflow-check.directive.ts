import { Directive, ElementRef, AfterViewInit, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appOverflowCheck]',
  standalone: true
})
export class OverflowCheckDirective implements AfterViewInit {
  @Output() hasOverflow = new EventEmitter<boolean>();

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.checkOverflow();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkOverflow();
  }

  private checkOverflow() {
    const el = this.el.nativeElement;
    // 判斷內部內容高度是否大於容器高度
    const overflowing = el.scrollHeight > el.clientHeight;
    this.hasOverflow.emit(overflowing);
  }
}
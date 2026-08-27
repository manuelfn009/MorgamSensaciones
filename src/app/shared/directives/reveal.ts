import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements OnInit {

  constructor(private el: ElementRef) {}

  ngOnInit() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.el.nativeElement.classList.add('show');
          observer.unobserve(this.el.nativeElement);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(this.el.nativeElement);
  }
}
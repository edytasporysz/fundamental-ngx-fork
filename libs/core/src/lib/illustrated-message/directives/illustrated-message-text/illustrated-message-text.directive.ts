import { Directive, HostBinding } from '@angular/core';

@Directive({
    // TODO to be discussed
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: '[fd-illustrated-message-text]',
    standalone: true
})
export class IllustratedMessageTextDirective {
    /** @hidden */
    @HostBinding('class.fd-illustrated-message__text')
    fdIllustratedMessageTextClass = true;
}

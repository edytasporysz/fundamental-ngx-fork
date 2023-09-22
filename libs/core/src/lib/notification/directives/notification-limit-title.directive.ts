import { Directive, HostBinding } from '@angular/core';

@Directive({
    selector: '[fdNotificationLimitTitle], [fd-notification-limit-title]',
    standalone: true
})
export class NotificationLimitTitleDirective {
    /** @hidden */
    @HostBinding('class.fd-notification__limit--title')
    fdNotificationTitleClass = true;
}

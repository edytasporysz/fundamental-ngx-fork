/**
 * @license
 * F. Kolar
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 */
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FD_FORM_FIELD_CONTROL } from '@fundamental-ngx/cdk/forms';

import { FormControlComponent } from '@fundamental-ngx/core/form';
import { BaseInput } from '@fundamental-ngx/platform/shared';

const VALID_INPUT_TYPES = ['text', 'number', 'email', 'password'];

export type InputType = 'text' | 'number' | 'email' | 'password';

/**
 * Input field implementation to be compliant with our FormGroup/FormField design and also to
 * achieve certain this in Angular this component is re-using several ideas from MatDesign
 *
 */
@Component({
    selector: 'fdp-input',
    templateUrl: 'input.component.html',
    styleUrl: './input.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: FD_FORM_FIELD_CONTROL, useExisting: InputComponent, multi: true }],
    imports: [FormControlComponent, FormsModule]
})
export class InputComponent extends BaseInput implements OnInit, AfterViewInit {
    /** Input type */
    @Input()
    type: InputType = 'text';

    /**
     * @hidden
     * This `required` field is used internally by other components such as Input Group.
     * Input group will not be able to set required value to input, until `required` is input through the`@Input` property.
     */
    @Input()
    declare required: boolean;

    /** return the value in the text box */
    @Input()
    set value(value: any) {
        super.setValue(value);
    }
    get value(): any {
        return super.getValue();
    }

    /** Emits event on focus change */
    @Output() focusChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    /** @hidden */
    get inputElementRef(): ElementRef {
        return this._elementRef;
    }

    /** @hidden */
    ngOnInit(): void {
        super.ngOnInit();
        if (!this.type || VALID_INPUT_TYPES.indexOf(this.type) === -1) {
            throw new Error(` Input type ${this.type} is not supported`);
        }
    }

    /** @hidden */
    _onFocus(): void {
        this._onFocusChanged(true);
        // propagate event
        this.focusChange.emit(true);
    }

    /** @hidden */
    _onBlur(): void {
        this._onFocusChanged(false);
        // propagate event
        this.focusChange.emit(false);
    }
}

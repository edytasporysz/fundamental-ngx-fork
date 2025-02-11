import { DELETE } from '@angular/cdk/keycodes';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ContentDensityMode, ContentDensityModule } from '@fundamental-ngx/core/content-density';
import { createKeyboardEvent, FieldHintOptions } from '@fundamental-ngx/platform/shared';
import { FdpFormGroupModule } from '../form-group/fdp-form.module';
import { FormFieldComponent } from '../form-group/form-field/form-field.component';
import { TextAreaComponent } from './text-area.component';
import { PlatformTextAreaModule } from './text-area.module';

@Component({
    selector: 'fdp-test-textarea',
    template: `
        <form [formGroup]="form" (ngSubmit)="onSubmit()" [fdContentDensity]="contentDensity">
            <fdp-form-group #fg1 [formGroup]="form">
                <fdp-form-field
                    #basicTextareaField
                    [id]="'basicTextarea'"
                    label="Basic Textarea with Platform Forms"
                    [placeholder]="'Start entering detailed description'"
                    [hint]="{ content: 'This is tooltip help', placement: 'left' }"
                    zone="zLeft"
                    rank="10"
                    [validators]="textareaValidator"
                >
                    <fdp-textarea
                        #testFocus
                        formControlName="basicTextarea"
                        name="'basicTextarea'"
                        [growingMaxLines]="3"
                        [growing]="true"
                        fdCompact
                        [maxLength]="10"
                        [cols]="10"
                        [state]="'error'"
                        [showExceededText]="true"
                        [height]="'80px'"
                        [wrapType]="'hard'"
                    ></fdp-textarea>
                    <button class="focus-button" type="button" (click)="testFocus.focus()">Click</button>
                </fdp-form-field>
                <ng-template #i18n let-errors>
                    @if (errors && errors.required) {
                        <span class="error">This field is required.</span>
                    }
                    @if (errors && errors.maxlength) {
                        <span> Please get your character count under limit. </span>
                    }
                </ng-template>
            </fdp-form-group>
            <button type="submit" #submitButton>Submit</button>
        </form>
    `,
    standalone: true,
    imports: [ReactiveFormsModule, FdpFormGroupModule, PlatformTextAreaModule, ContentDensityModule]
})
class BasicTextareaTestWrapperComponent {
    @ViewChild(TextAreaComponent)
    textareaComponent: TextAreaComponent;
    @ViewChild('basicTextareaField') basicTextareaField: FormFieldComponent;

    @ViewChild('submitButton') submitButton: ElementRef<HTMLElement>;

    contentDensity: ContentDensityMode = ContentDensityMode.COZY;
    form: FormGroup = new FormGroup({
        basicTextarea: new FormControl('this is a random note')
    });

    textareaValidator: ValidatorFn[] = [Validators.maxLength(10), Validators.required];

    result: any = null;

    onSubmit(): void {
        this.result = this.form.value;
    }
}

describe('Basic Textarea', () => {
    let fixture: ComponentFixture<BasicTextareaTestWrapperComponent>;
    let host: BasicTextareaTestWrapperComponent;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [BasicTextareaTestWrapperComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BasicTextareaTestWrapperComponent);
        host = fixture.componentInstance;

        fixture.detectChanges();
    });

    async function wait(componentFixture: ComponentFixture<any>): Promise<void> {
        componentFixture.detectChanges();
        await componentFixture.whenStable();
    }

    it('should create', () => {
        expect(host).toBeTruthy();
    });

    it('should have compact class applied', () => {
        const textareaElement = fixture.debugElement.query(By.css('textarea'));
        expect(textareaElement.nativeElement.classList.contains('is-compact')).toBeTruthy();
    });

    it('should have a label, hint, placeholder and default value', async () => {
        await wait(fixture);

        const textareaLabel = host.basicTextareaField.label;
        expect(textareaLabel).toBe('Basic Textarea with Platform Forms');

        const textareaPlaceholder = host.basicTextareaField.placeholder;
        expect(textareaPlaceholder).toBe('Start entering detailed description');

        const textareaHint = (host.basicTextareaField.hint as FieldHintOptions).content;
        expect(textareaHint).toBe('This is tooltip help');

        const textareaDefaultValue = host.form.get('basicTextarea')?.value;
        expect(textareaDefaultValue).toBe('this is a random note');
    });

    it('should accept a different custom value', async () => {
        const textareaElement = host.textareaComponent;
        textareaElement.value = 'this is a new value';
        await wait(fixture);
        expect(host.form.get('basicTextarea')?.value).toBe('this is a new value');

        textareaElement.value = '';
        await wait(fixture);

        expect(host.form.get('basicTextarea')?.value).toBe('');
    });

    it('should submit the value', async () => {
        const submitButton = host.submitButton.nativeElement;
        submitButton.click();

        await wait(fixture);

        expect(host.result).toEqual({ basicTextarea: 'this is a random note' });
    });
});

describe('Advanced Textarea', () => {
    let fixture: ComponentFixture<BasicTextareaTestWrapperComponent>;
    let host: BasicTextareaTestWrapperComponent;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [BasicTextareaTestWrapperComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BasicTextareaTestWrapperComponent);
        host = fixture.componentInstance;

        // fixture.detectChanges();
    });

    async function wait(componentFixture: ComponentFixture<any>): Promise<void> {
        componentFixture.detectChanges();
        await componentFixture.whenStable();
    }

    it('should call validateLengthOnCustomSet', async () => {
        await wait(fixture);
        const textareaElement = host.textareaComponent;
        jest.spyOn(textareaElement, 'validateLengthOnCustomSet');
        textareaElement.maxLength = 5;
        textareaElement.value = 'abcdefgg';

        expect(textareaElement.validateLengthOnCustomSet).toHaveBeenCalled();
    });

    it('should change the counter message correctly', async () => {
        await wait(fixture);
        const textareaElement = host.textareaComponent;
        textareaElement.maxLength = 5;
        textareaElement.value = 'abcdefgg';

        await wait(fixture);

        expect(host.form.get('basicTextarea')?.value).toBe('abcdefgg');

        const textareaCounterElement = fixture.debugElement.query(By.css('.fd-textarea-counter'));
        const result = textareaCounterElement.nativeElement.textContent.toString().trim();
        expect(result).toBe('3 characters over the limit');
    });

    it('should change the counter message correctly when within limit', async () => {
        await wait(fixture);
        const textareaElement = host.textareaComponent;
        textareaElement.maxLength = 5;
        textareaElement.value = 'abc';

        await wait(fixture);

        expect(host.form.get('basicTextarea')?.value).toBe('abc');

        const textareaCounterElement = fixture.debugElement.query(By.css('.fd-textarea-counter'));
        const result = textareaCounterElement.nativeElement.textContent.toString().trim();
        expect(result).toBe('2 characters remaining');
    });

    it('should not focus when textarea is disabled', async () => {
        await wait(fixture);
        const textareaElement = host.textareaComponent;
        jest.spyOn(textareaElement, 'setDisabledState');

        host.form.get('basicTextarea')?.disable();
        await wait(fixture);
        expect(host.form.get('basicTextarea')?.disabled).toBe(true);
        expect(textareaElement.setDisabledState).toHaveBeenCalled();
        textareaElement._targetElement.click();
        await wait(fixture);
    });

    it('should handle backpress for deleting excess or remaining characters', async () => {
        await wait(fixture);
        const textareaComponent = host.textareaComponent;
        textareaComponent._targetElement.focus();
        textareaComponent.showExceededText = false;
        textareaComponent.maxLength = 5;
        textareaComponent.value = 'abcdef';
        textareaComponent.growing = false;
        const keyboardEvent = createKeyboardEvent('keydown', DELETE, 'Delete');
        textareaComponent.handleBackPress(keyboardEvent);
        await fixture.whenStable();

        expect(host.form.get('basicTextarea')?.value).toBe('abcde');
    });

    it('should call autogrow method', async () => {
        await wait(fixture);
        const textareaElement = host.textareaComponent;
        jest.spyOn(textareaElement, 'autoGrowTextArea');

        textareaElement.handleBackPress(new KeyboardEvent('keyup', { key: 'd' }));
        await wait(fixture);
        expect(textareaElement.autoGrowTextArea).toHaveBeenCalled();
    });
});

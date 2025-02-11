import { DragDrop, DragRef } from '@angular/cdk/drag-drop';
import {
    AfterContentInit,
    Directive,
    ElementRef,
    EventEmitter,
    HostBinding,
    Input,
    OnDestroy,
    Output,
    Renderer2,
    forwardRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Nullable } from '../../models/nullable';
import { DndItem, ElementChord, ElementPosition, LinkPosition } from '../dnd.interfaces';
import { DND_ITEM } from '../tokens';

@Directive({
    selector: '[fdkDndItem], [fd-dnd-item]',
    providers: [DragDrop, { provide: DND_ITEM, useExisting: forwardRef(() => DndItemDirective) }],
    standalone: true
})
export class DndItemDirective<T = any> implements DndItem, AfterContentInit, OnDestroy {
    /** Item reference. Used for cases when `[items]` array of dnd list is different than `dndItems` content children. */
    @Input('fdkDndItem')
    item: Nullable<T>;
    /**
     * Whether to apply "fd-dnd-item" class.
     * @default true
     */
    @Input()
    @HostBinding('class.fd-dnd-item')
    applyDragItemClass = true;

    /** Container selector */
    @Input()
    containerSelector?: string;

    /** Event thrown when the element is moved by 1px */
    @Output()
    readonly moved = new EventEmitter<ElementPosition>();

    /** Event thrown when the element is released */
    @Output()
    readonly released = new EventEmitter<void>();

    /** Event thrown when the element is started to be dragged */
    @Output()
    readonly started = new EventEmitter<void>();

    /**
     *  Defines if the item is prevented from being moved by other elements.
     * So nothing can be placed just before and just after it
     */
    @Input()
    stickInPlace = false;

    /** Defines if element is draggable */
    @Input()
    set draggable(draggable: boolean) {
        this._draggable = draggable;
        this.changeCDKDragState();
    }

    /** Class added to element, when it's dragged. */
    @Input()
    classWhenElementDragged = 'fd-dnd-on-drag';

    /** Defines if every element in list is draggable */
    listDraggable = true;

    /** @hidden
     * Drag reference, object created from DND CDK Service
     */
    private _dragRef: DragRef;

    /** @hidden */
    private _draggable = true;

    /** @hidden */
    private _subscriptions = new Subscription();

    /** @hidden */
    private _placeholderElement: HTMLElement | null = null;

    /** @hidden */
    private _lineElement: HTMLElement | null = null;

    /** @hidden */
    private _replaceIndicator: HTMLElement | null = null;

    /** @hidden */
    constructor(
        public readonly elementRef: ElementRef,
        private readonly _dragDrop: DragDrop,
        private readonly _renderer: Renderer2
    ) {}

    /** @hidden */
    getElementCoordinates(isBefore: boolean): ElementChord {
        /** Takes distance from the beginning of window page */
        const rect = this.elementRef.nativeElement.getBoundingClientRect();

        const position: LinkPosition = isBefore ? 'before' : 'after';

        /** Vertically distance is counted by distance from top of the side + half of the element height */
        return {
            x: rect.left,
            position,
            y: rect.top,
            stickToPosition: this.stickInPlace,
            width: rect.width,
            height: rect.height
        };
    }

    /** @hidden */
    ngAfterContentInit(): void {
        this._setCDKDrag();
        this._listenElementEvents();
    }

    /** @hidden */
    ngOnDestroy(): void {
        this._subscriptions.unsubscribe();
        this._dragRef.dispose();
    }

    /** @hidden */
    onCdkMove(position: ElementPosition): void {
        this.moved.emit(position);
    }

    /** @hidden */
    onCdkDragReleased(): void {
        /** Remove class which is added, when element is dragged */
        this.elementRef.nativeElement.classList.remove(this.classWhenElementDragged);
        this.released.emit();

        /** Resets the position of element. */
        this._dragRef.reset();

        /** Removes placeholder element */
        this.removePlaceholder();
    }

    /** @hidden */
    onCdkDragStart(): void {
        /** Adds class */
        this.elementRef.nativeElement.classList.add(this.classWhenElementDragged);

        if (!this._placeholderElement) {
            this.createPlaceholder();
        }
        this.started.emit();
    }

    /** @hidden */
    removePlaceholder(): void {
        if (this._placeholderElement && this._placeholderElement.parentNode) {
            // IE11 workaround
            this._placeholderElement.parentNode.removeChild(this._placeholderElement);
            this._placeholderElement = null;
        }
    }

    /** @hidden */
    removeLine(): void {
        if (this._lineElement && this._lineElement.parentNode) {
            // IE11 workaround
            this._lineElement.parentNode.removeChild(this._lineElement);
            this._lineElement = null;
        }
    }

    /** @hidden */
    removeReplaceIndicator(): void {
        if (this._replaceIndicator && this._replaceIndicator.parentNode) {
            // IE11 workaround
            this._replaceIndicator.parentNode.removeChild(this._replaceIndicator);
            this._replaceIndicator = null;
        }
    }

    /** @hidden */
    createReplaceIndicator(): void {
        this._replaceIndicator = document.createElement('DIV');
        this._replaceIndicator.classList.add('fd-replace-indicator');

        let container = this.elementRef.nativeElement;
        if (this.containerSelector) {
            const newContainer = this.elementRef.nativeElement.querySelector(this.containerSelector);
            if (newContainer) {
                container = newContainer;
            }
        }

        container.appendChild(this._replaceIndicator);
    }

    /** @hidden */
    createLine(position: LinkPosition, gridMode: boolean): void {
        /** Creating of line element */
        this._lineElement = document.createElement('div');
        this._lineElement.classList.add('drop-area__line');

        if (gridMode) {
            this._lineElement.classList.add('drop-area__line--vertical');
        } else {
            this._lineElement.classList.add('drop-area__line--horizontal');
        }
        if (position === 'after') {
            this._lineElement.classList.add('after');
        }
        if (position === 'before') {
            this._lineElement.classList.add('before');
        }

        /** Putting element to the container */
        let container = this.elementRef.nativeElement;
        if (this.containerSelector) {
            const newContainer = this.elementRef.nativeElement.querySelector(this.containerSelector);
            if (newContainer) {
                container = newContainer;
            }
        }

        container.appendChild(this._lineElement);
    }

    /** @hidden */
    changeCDKDragState(): void {
        if (this._dragRef) {
            this._dragRef.disabled = !(this._draggable && this.listDraggable);
        }
    }

    /**
     * Sets the disabled state of the dnd item.
     * @param state
     */
    setDisabledState(state: boolean): void {
        if (state) {
            this._renderer.addClass(this.elementRef.nativeElement, 'fd-dnd-item--disabled');
        } else {
            this._renderer.removeClass(this.elementRef.nativeElement, 'fd-dnd-item--disabled');
        }
    }

    /** @hidden */
    private createPlaceholder(): void {
        const placeholder = this.elementRef.nativeElement.cloneNode(true);
        /** Cloning container element */
        this._placeholderElement = placeholder;

        placeholder.classList.add('fd-dnd-placeholder');
        this._setPlaceholderStyles();

        /** Including element to the container
         *  IE11 equivalent to `this.element.nativeElement.after(clone);`
         */
        this._placeAfter(this.elementRef.nativeElement, placeholder);
    }

    /** @hidden */
    private _setPlaceholderStyles(): void {
        const offset = this._getOffsetToParent(this.elementRef.nativeElement);

        if (!offset || !this._placeholderElement) {
            return;
        }

        this._placeholderElement.style.top = offset.y + 'px';
        this._placeholderElement.style.left = offset.x + 'px';
        this._placeholderElement.style.position = 'absolute';
        this._placeholderElement.style.zIndex = '0';
        this._placeholderElement.style.opacity = '0.3';

        this._placeholderElement.style.width = this.elementRef.nativeElement.offsetWidth + 'px';
        this._placeholderElement.style.height = this.elementRef.nativeElement.offsetHeight + 'px';
    }

    /** @hidden */
    private _getOffsetToParent(element: Element): { x: number; y: number } | undefined {
        const parentElement = element.parentElement;
        if (!parentElement) {
            return;
        }

        const parentElmRect = parentElement.getBoundingClientRect();
        const elmRect = element.getBoundingClientRect();

        const parentTop = parentElmRect.top;
        const parentLeft = parentElmRect.left;

        return {
            x: Math.abs(elmRect.left - parentLeft),
            y: Math.abs(elmRect.top - parentTop)
        };
    }

    /** @hidden */
    private _setCDKDrag(): void {
        this._dragRef = this._dragDrop.createDrag(this.elementRef);
        this._dragRef.disabled = !this._draggable;
        this._subscriptions.add(this._dragRef.moved.subscribe((event) => this.onCdkMove(event.pointerPosition)));
        this._subscriptions.add(this._dragRef.released.subscribe(() => this.onCdkDragReleased()));
        this._subscriptions.add(this._dragRef.started.subscribe(() => this.onCdkDragStart()));
    }

    /** IE11 equivalent of Node.after() Method */
    private _placeAfter(element: Element, cloneNode: Node): void {
        const docFrag = document.createDocumentFragment();
        docFrag.appendChild(cloneNode);
        element.parentNode?.insertBefore(docFrag, element.nextSibling);
    }

    /** @hidden */
    private _listenElementEvents(): void {
        this._subscriptions.add(
            this.released
                .pipe(
                    // postpone blur
                    delay(0)
                )
                .subscribe(() => {
                    if (this.containerSelector) {
                        this.elementRef.nativeElement.children[0].blur();
                    }
                    this.elementRef.nativeElement.blur();
                })
        );
    }
}

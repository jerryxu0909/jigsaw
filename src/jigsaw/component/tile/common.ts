import {AbstractJigsawComponent} from "../common";
import {ControlValueAccessor} from "@angular/forms";
import {AfterContentInit, ChangeDetectorRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList} from "@angular/core";
import {CallbackRemoval, CommonUtils} from "../../core/utils/common-utils";
import {ArrayCollection} from "../../core/data/array-collection";
import {JigsawTileOption} from "./tile";

export class AbstractJigsawGroupComponent extends AbstractJigsawComponent implements ControlValueAccessor, OnInit, AfterContentInit, OnDestroy {
    protected _removeRefreshCallback: CallbackRemoval;

    //设置对象的标识
    @Input() public trackItemBy: string | string[];

    //判断是否支持多选
    @Input() public multipleSelect: boolean;

    protected _selectedItems = new ArrayCollection<object>();

    @Input()
    public get selectedItems(): ArrayCollection<object> | object[] {
        return this._selectedItems;
    }

    public set selectedItems(newValue: ArrayCollection<object> | object[]) {
        this.writeValue(newValue);
        if (this._selectedItems !== newValue) {
            this._propagateChange(newValue);
        }
    }

    @Output() public selectedItemsChange = new EventEmitter<any[]>();

    //获取映射的items
    protected _items: QueryList<AbstractJigsawOptionComponent>;

    protected _updateSelectItems(itemValue, selected): void {
        if (this.multipleSelect) { //多选
            if (selected) {
                this.selectedItems.push(itemValue);
            } else {
                this._selectedItems.forEach(selectedItemValue => {
                    if (CommonUtils.compareWithKeyProperty(selectedItemValue, itemValue, <string[]>this.trackItemBy)) {
                        this._selectedItems.splice(this.selectedItems.indexOf(selectedItemValue), 1);
                    }
                });
            }
        } else { //单选选中
            this._items.length && this._items.forEach((item: AbstractJigsawOptionComponent) => {
                //去除其他option选中
                if (!CommonUtils.compareWithKeyProperty(item.value, itemValue, <string[]>this.trackItemBy) && item.selected) {
                    item.selected = false;
                    item.changeDetector.detectChanges();
                    this._selectedItems.splice(this.selectedItems.indexOf(item.value), 1);
                }
            });
            //添加选中数据
            this.selectedItems.push(itemValue);
        }
        this._selectedItems.refresh();
        this.selectedItemsChange.emit(this.selectedItems);
    }

    //根据选中的item更新selectedItems
    protected _updateSelectItemsForForm(itemValue, selected): void {
        this._updateSelectItems(itemValue, selected);
        this._propagateChange(this.selectedItems);
    }

    //根据selectedItems设置选中的option
    protected _setItemState(): void {
        if (!(this.selectedItems instanceof ArrayCollection) || !this._items.length) {
            return;
        }
        setTimeout(() => {
            this._items.forEach(item => {
                let hasSelected = false;
                this._selectedItems.forEach(selectedItem => {
                    if (CommonUtils.compareWithKeyProperty(item.value, selectedItem, <string[]>this.trackItemBy)) {
                        hasSelected = true;
                    }
                });
                item.selected = hasSelected;
                item.changeDetector.detectChanges();
            });
        })
    }

    ngOnInit() {
        super.ngOnInit();
        if (this.trackItemBy) {
            this.trackItemBy = (<string>this.trackItemBy).split(/\s*,\s*/g);
        } else {
            console.warn('please input trackItemBy attribute in jigsaw-title control')
        }
    }

    ngAfterContentInit() {
        this._setItemState();
        this._items.forEach(item => {
            item.selectedChange.subscribe(() => {
                if (this.multipleSelect) { //多选
                    item.selected = !item.selected;//切换组件选中状态
                    this._updateSelectItemsForForm(item.value, item.selected);
                } else { //单选
                    if (!item.selected) {
                        item.selected = true;
                        this._updateSelectItemsForForm(item.value, item.selected);
                    }
                }
            })
        })
    }

    ngOnDestroy() {
        if (this._removeRefreshCallback) {
            this._removeRefreshCallback()
        }
    }

    protected _propagateChange: any = () => {};

    protected _setSelectedItems(newValue: any): void {
        if (this._selectedItems === newValue) {
            return;
        }
        newValue = newValue instanceof ArrayCollection ? newValue : new ArrayCollection(newValue);

        this._selectedItems = newValue;
        if (this.initialized) {
            this._setItemState();
        }

        if (this._removeRefreshCallback) {
            this._removeRefreshCallback()
        }
        this._removeRefreshCallback = newValue.onRefresh(() => {
            this._setItemState();
        });
    }

    public writeValue(newValue: any): void {
        this._setSelectedItems(newValue);
    }

    public registerOnChange(fn: any): void {
        this._propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
    }
}

export class AbstractJigsawOptionComponent extends AbstractJigsawComponent {
    @Input() public value: any;

    @Input() public disabled: boolean = false;

    @Input()
    public selected: boolean = false; // 选中状态

    @Output()
    public selectedChange = new EventEmitter<JigsawTileOption>();

    constructor(public changeDetector: ChangeDetectorRef) {
        super();
    }
}

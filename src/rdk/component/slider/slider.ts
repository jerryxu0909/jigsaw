/**
 * Created by 10177553 on 2017/4/13.
 */
import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    Renderer2,
    ViewChildren,
    ViewEncapsulation
} from "@angular/core";
import {SliderHandle} from "./handle";
import {CommonUtils} from "../../core/utils/common-utils";
import {ArrayCollection} from "../../core/data/array-collection";
import {CallbackRemoval} from "../../core/data/component-data";
import {AbstractRDKComponent, IRDKComponent} from "../core";

export class SliderMark {
    value: number;
    label: string;
    style?: any;
}

@Component({
    selector: 'rdk-slider',
    templateUrl: './slider.html',
    styleUrls: ['./slider.scss'],
    host: {
        'class': 'rdk-slider-host'
    },
    encapsulation: ViewEncapsulation.None
})
/**
 *       4. tooltips 支持. 暂不支持
 *       5. 点击的支持。
 */
export class RdkSlider extends AbstractRDKComponent implements OnInit, OnDestroy {

    constructor(private _element: ElementRef, private _render: Renderer2) {
        super();
    }

    // Todo 支持滑动条点击.
    @ViewChildren(SliderHandle) private _sliderHandle: QueryList<SliderHandle>;

    private _value: ArrayCollection<number> = new ArrayCollection<number>();
    private _removeRefreshCallback: CallbackRemoval;

    @Input()
    public get value(): number | ArrayCollection<number> {
        // 兼容返回单个值， 和多触点的数组;
        if (this._value.length == 1) {
            return this._value[0];
        } else {
            return this._value;
        }
    }

    public set value(value: number | ArrayCollection<number>) {
        if (value instanceof ArrayCollection) {
            this._value = value;
        } else {
            this._value.splice(0, this._value.length);
            this._value.push(this._verifyValue(value));
        }

        if (this._removeRefreshCallback) {
            this._removeRefreshCallback()
        }
        this._removeRefreshCallback = this._value.onRefresh(() => {
            this._setTrackStyle(this.value);
            this.valueChange.emit(this.value);
        });
    }

    /**
     * 设置单个的值。内部使用
     *
     * @param index
     * @param value
     * @private
     */
    public _setValue(index: number, value: number) {
        this._value.set(index, value);
        this._value.refresh();
    }

    // 最后重新计算一下, 垂直滚动条的位置.
    public _refresh() {
        this._dimensions = this._element.nativeElement.getBoundingClientRect();
    }

    @Output()
    public valueChange = new EventEmitter<number | ArrayCollection<number>>();

    @Output()
    public change = this.valueChange;

    private _min: number = 0;

    @Input()
    public get min() {
        return this._min;
    }

    public set min(min: number) {
        this._min = min;
    }

    private _max: number = 100;
    @Input()
    public get max() {
        return this._max;
    }

    public set max(max: number) {
        this._max = max;
    }

    private _step: number = 1;
    @Input()
    public get step() {
        return this._step;
    }

    public set step(value: number) {
        this._step = value;
    }

    public _transformValueToPos(value?) {
        // 检验值的合法性, 不合法转换成默认可接受的合法值;
        value = this._verifyValue(value);

        return (value - this.min) / (this.max - this.min) * 100;
    }

    public _dimensions;

    @Input()
    public vertical: boolean = false;

    // tipFormatter() {
    //     // Todo 格式化, 弹出信息.
    // }

    @Input()
    public disabled: boolean = false;

    private _trackStyle = {};

    private _setTrackStyle(value?) {
        // 兼容双触点.
        let startPos: number = 0;
        let trackSize: number = typeof value !== 'undefined' ? this._transformValueToPos(value) : this._transformValueToPos(this.value); // 默认单触点位置

        if (this._value.length > 1) {
            let max: number = this._value[0];
            let min: number = this._value[0];

            this._value.map(item => {
                if (max - item < 0) max = item;
                else if (item - min < 0) min = item;
            });

            startPos = this._transformValueToPos(min);
            trackSize = Math.abs(this._transformValueToPos(max) - this._transformValueToPos(min));
        }

        if (this.vertical) { // 垂直和水平两种
            this._trackStyle = {
                bottom: startPos + "%",
                height: trackSize + "%"
            }
        } else {
            this._trackStyle = {
                left: startPos + "%",
                width: trackSize + "%"
            }
        }
    }

    // 多值时选择一个合适的触点. Todo 支持点击
    _updateValuePosition() {
        // let handle = this._sliderHandle.first;
        // Todo
    }

    public _$marks: any[] = [];
    private _marks: SliderMark[];

    @Input()
    public get marks(): SliderMark[] {
        return this._marks;
    }

    public set marks(value: SliderMark[]) {
        this._marks = value;
        this._calcMarks();
    }

    private _calcMarks() {
        if (!this._marks || !this.initialized) return;

        this._$marks.splice(0, this._$marks.length);
        let size = Math.round(100 / this._marks.length);
        let margin = -Math.floor(size / 2);
        let vertical = this.vertical;

        this._marks.forEach(mark => {
            const richMark:any = {};
            if (vertical) {
                richMark.dotStyle = {
                    bottom: this._transformValueToPos(mark.value) + "%"
                };
                richMark.labelStyle = {
                    bottom: this._transformValueToPos(mark.value) + "%",
                    "margin-bottom": margin + "%"
                };
            } else {
                richMark.dotStyle = {
                    top: "-2px",
                    left: this._transformValueToPos(mark.value) + "%"
                };
                richMark.labelStyle = {
                    left: this._transformValueToPos(mark.value) + "%",
                    width: size + "%", "margin-left": margin + "%"
                };
            }
            // 如果用户自定义了样式, 要进行样式的合并;
            CommonUtils.extendObject(richMark.labelStyle, mark.style);
            richMark.label = mark.label;
            this._$marks.push(richMark);
        });
    }

    ngOnInit() {
        super.ngOnInit();

        // 计算slider 的尺寸.
        this._dimensions = this._element.nativeElement.getBoundingClientRect();

        // 设置选中的轨道.
        this._setTrackStyle(this.value);

        // 设置标记.
        this._calcMarks();
        // 注册resize事件;
        this.resize();
    }

    private _removeResizeEvent: Function;

    private resize() {
        this._removeResizeEvent = this._render.listen("window", "resize", () => {
            // 计算slider 的尺寸.
            this._dimensions = this._element.nativeElement.getBoundingClientRect();
        })
    }

    /**
     * 暂没有使用场景.
     */
    public ngOnDestroy() {
        if (this._removeResizeEvent) {
            this._removeResizeEvent();
        }

        if (this._removeRefreshCallback) {
            this._removeRefreshCallback()
        }
    }

    /**
     * 校验value的合法性. 大于最大值，取最大值, 小于最小值取最小值.
     * @param value
     * @private
     */
    public _verifyValue(value: number) {
        if (value - this.min < 0) {
            return this.min;
        } else if (value - this.max > 0) {
            return this.max;
        } else {
            return value;
        }
    }
}

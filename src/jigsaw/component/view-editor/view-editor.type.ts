import {JigsawViewLayout} from "./view-editor";
import {ComponentRef, EmbeddedViewRef} from "@angular/core";

export type ComponentInput = {
    property: string,
    type?: string,
    default?: any,
    binding?: string
}

export type ComponentMetaData = {
    [index: string]: any,
    component: any,
    selector: string,
    inputs?: ComponentInput[],
    outputs?: any,
    import?: string
}

export type LayoutComponentInfo = {
    layout: JigsawViewLayout,
    component: ComponentRef<any> | EmbeddedViewRef<any>
}


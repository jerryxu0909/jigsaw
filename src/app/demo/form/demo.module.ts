import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {TemplateDrivenDemoModule} from "./template-driven/app.module";

import {TemplateDrivenDemoComponent} from "./template-driven/app.component";

export const routerConfig = [
    {
        path: 'template-driven', component: TemplateDrivenDemoComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routerConfig),
        TemplateDrivenDemoModule,
    ]
})
export class FormDemoModule {
}

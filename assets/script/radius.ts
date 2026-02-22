import { _decorator, Component, Graphics, UITransform, Color } from "cc";
const { ccclass, property, executeInEditMode } = _decorator;
// RoundedCorners.ts

@ccclass
@executeInEditMode
export default class RoundedCorners extends Component {
    @property({ tooltip: "圆角的半径大小" })
    radius: number = 10;
    graphics: Graphics;
    color: string;
    fillColor: Color;
    isDraw: boolean = false;
    protected onLoad(): void {
        this.graphics = this.node.getComponent(Graphics);
    }
    protected onEnable(): void {
        if (this.isDraw) return;
        this.isDraw = true;
        this.draw();
    }
    updateColor(color: string) {
        if (this.color === color) {
            return;
        }
        this.color = color;
        this.fillColor = new Color(color);
        if (!this.graphics) {
            return;
        }
        this.draw();
    }
    updateAlpha(alpha: number) {
        this.fillColor.a = alpha;
        this.draw();
    }
    updateSize() {
        this.draw();
    }
    updateRadius(radius: number) {
        this.radius = radius;
        this.draw();
    }
    draw() {
        const uiTransform = this.getComponent(UITransform);
        const { width, height, anchorX, anchorY } = uiTransform;
        const x = -width * anchorX;
        const y = -height * anchorY;
        this.graphics.clear();
        if (this.color) {
            this.graphics.fillColor = this.fillColor;
        }
        this.graphics.roundRect(x, y, width, height, this.radius || 0);
        this.graphics.fill();
    }
}

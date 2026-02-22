import {
  _decorator,
  Component,
  Node,
  EventTouch,
  Vec2,
  input,
  Input,
  EventKeyboard,
  KeyCode,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("SwipeHandler")
export class SwipeHandler extends Component {
  @property
  public swipeThresholdPX: number = 20; // 滑动触发阈值(像素)

  public moveThresholdTime: number = 150; // move触发阈值(时间)

  @property
  public enableHorizontal: boolean = true; // 启用水平滑动

  @property
  public enableVertical: boolean = true; // 启用垂直滑动

  @property
  public enableClick: boolean = false; // 启用点击事件

  @property
  public enableMove: boolean = false; // 启用移动事件

  private startPos: Vec2 = new Vec2();
  private lastPos: Vec2 = new Vec2();
  private touchId: number | null = null;
  private isEmitMove: boolean = false; //是否触发move
  private startTime: number = 0; // 触摸开始时间

  onEnable() {
    // 注册触摸事件
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  onDisable() {
    // 移除事件监听
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  private onTouchStart(event: EventTouch) {
    if (this.touchId !== null) return;
    const touchId = event.getID();
    this.touchId = touchId;

    this.startPos = event.getLocation();
    this.lastPos = event.getLocation();
    this.startTime = Date.now();
  }

  private onTouchMove(event: EventTouch) {
    // 可以在这里添加实时滑动处理逻辑
    if (this.touchId !== event.getID()) return;
    if (!this.enableMove) return;
    if (Date.now() - this.startTime < this.moveThresholdTime) return;

    const endPos = event.getLocation();
    if (
      this.isEmitMove ||
      Math.abs(endPos.x - this.startPos.x) > this.swipeThresholdPX ||
      Math.abs(endPos.y - this.startPos.y) > this.swipeThresholdPX
    ) {
      this.node.emit("move", endPos, this.lastPos, this.startPos);
      this.lastPos = endPos;
      this.isEmitMove = true;
    }
  }

  private onTouchEnd(event: EventTouch, isCancel: boolean = false) {
    if (this.touchId !== event.getID()) return;
    this.touchId = null;

    if (this.isEmitMove) {
      // 触发了move就不检测swipe了
      this.isEmitMove = false;
      return;
    }
    const endPos = event.getLocation();
    const deltaX = endPos.x - this.startPos.x;
    const deltaY = endPos.y - this.startPos.y;
    if (
      this.enableClick &&
      Math.abs(deltaX) <= this.swipeThresholdPX &&
      Math.abs(deltaY) <= this.swipeThresholdPX &&
      !isCancel
    ) {
      this.node.emit("click");
      return;
    }
    // 判断滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (this.enableHorizontal) {
        if (deltaX > this.swipeThresholdPX) {
          this.node.emit("swipe-right", deltaX);
        } else if (deltaX < -this.swipeThresholdPX) {
          this.node.emit("swipe-left", deltaX);
        }
      }
    } else {
      // 垂直滑动
      if (this.enableVertical) {
        if (deltaY > this.swipeThresholdPX) {
          this.node.emit("swipe-up", deltaY);
        } else if (deltaY < -this.swipeThresholdPX) {
          this.node.emit("swipe-down", deltaY);
        }
      }
    }
  }

  private onTouchCancel(event: EventTouch) {
    if (this.touchId !== event.getID()) return;
    this.onTouchEnd(event, true);
    this.touchId = null;
    this.isEmitMove = false;
  }

  /** 通过Input实例处理键盘方向键事件 */
  private onKeyDown(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.ARROW_RIGHT: // 右方向键
        if (this.enableHorizontal) this.node.emit("swipe-right", 0);
        break;
      case KeyCode.ARROW_LEFT: // 左方向键
        if (this.enableHorizontal) this.node.emit("swipe-left", 0);
        break;
      case KeyCode.ARROW_UP: // 上方向键
        if (this.enableVertical) this.node.emit("swipe-up", 0);
        break;
      case KeyCode.ARROW_DOWN: // 下方向键
        if (this.enableVertical) this.node.emit("swipe-down", 0);
        break;
      case KeyCode.SPACE: // 空格
        if (this.enableClick) this.node.emit("click");
        break;
    }
  }
}

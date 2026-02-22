import { _decorator, Component, Node, NodeEventType, Event } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameOver')
export class GameOver extends Component {
    onClickCallback: () => void = null;
    start() {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
    onTouchEnd(event: Event) {
        console.log("touch end");
    }
    clickRetry() {
        this.onClickCallback();
    }
    onClickRetry(cb: typeof this.onClickCallback) {
        this.onClickCallback = cb;
    }

    update(deltaTime: number) {

    }
}



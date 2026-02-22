import {
  _decorator,
  Component,
  Label,
  Node,
  tween,
  Vec3,
  Color,
  UITransform,
  UIOpacity,
  Graphics,
  Prefab, // 导入预制体模块
  instantiate, // 导入实例化函数
  ParticleSystem2D,
  resources,
  Sprite,
  SpriteFrame, // 导入粒子系统组件
} from "cc";
import RoundedCorners from "./radius";
const { ccclass, property } = _decorator;
const size = 120
const space = 10
export const colors = [
  ["#eee4da", "#000000"],
  ["#ede0c8", "#000000"],
  ["#f2b179", "#f9f6f2"],
  ["#f59563", "#f9f6f2"],
  ["#f67c5f", "#f9f6f2"],
  ["#f65e3b", "#f9f6f2"],
  ["#edcf72", "#f9f6f2"],
  ["#edcc61", "#f9f6f2"],
  ["#edc850", "#f9f6f2"],
  ["#edc53f", "#f9f6f2"],
  ["#edc22e", "#f9f6f2"],
];

@ccclass("Tile")
export class Tile extends Component {
  /**
   * 显示的值
   */
  @property(Label)
  label: Label = null;

  clickable: boolean = true;
  static readonly moveTime: number = 0.1;
  static readonly createTime: number = 0.2;
  x: number = 0;
  y: number = 0;
  size: number = 120;
  scale: number = 1;
  color: string;
  value: number;
  isGray: boolean = false;
  @property(Prefab)
  grayPrefab: Prefab = null;

  onClickCallback: (x: number, y: number, tile?: Tile) => void = null;

  start() {
    if (this.clickable) {
      this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
  }
  onTouchEnd() {
    if (this.onClickCallback) {
      this.onClickCallback(this.x, this.y, this);
    }
  }
  updateValue(value: number) {
    this.setValue(value);
    tween(this.node)
      .to(
        0.3,
        {
          scale: new Vec3(0.7 * this.scale, 0.7 * this.scale, 0.7 * this.scale),
        },
        {
          easing: "backOut",
        }
      )
      .to(
        0.3,
        { scale: new Vec3(1 * this.scale, 1 * this.scale, 1 * this.scale) },
        {
          easing: "backOut",
        }
      )
      .start();
  }

  setClickable(clickable: boolean) {
    this.clickable = clickable;
  }

  /**
   *
   * @param value 设置值
   */
  setValue(value?: number) {
    this.value = value;
    const v = Math.abs(value) || 10;
    this.updateBGColor(this.color || colors[(v - 1) % colors.length][0]);
    if (typeof value === "undefined") {
      this.label.string = "";
    } else {
      this.label.color = new Color(colors[(v - 1) % colors.length][1]);
      this.label.string = value.toString();
      this.label.node.active = true;
    }
  }
  updateBGColor(color: string) {
    this.node.getComponent(RoundedCorners).updateColor(color);
  }
  setColor(color: string) {
    if (this.color === color) {
      return;
    }
    this.color = color;
    this.updateBGColor(color);
  }

  /**
   * 初始化Tile
   * @param value 值
   * @param x
   * @param y
   */
  initTile(props: {
    value?: number;
    x: number;
    y: number;
    size?: number;
    fontSize?: number;
    cols?: number;
    clickable?: boolean;
    color?: string;
    disableAnim?: boolean;
    radius?: number;
    noShadow?: boolean;
    noPosition?: boolean;
    isImage?: boolean;
  }) {
    const {
      value,
      x,
      y,
      size = 160,
      clickable = true,
      color,
      disableAnim,
      noPosition,
    } = props;

    this.clickable = clickable;
    this.color = color;

    this.x = x;
    this.y = y;
    this.setValue(value);
    if (size) {
      this.size = size;
      this.scale = this.size / 200;
      this.node.setScale(this.scale, this.scale, this.scale);
    }
    !disableAnim && this.playCreateAnim();
    !noPosition && this.node.setPosition(this.getPosition(x, y));
  }

  setGray(gray: boolean) {
    if (this.isGray === gray) return;
    this.isGray = gray;
    let grayNode = this.node.getChildByName("gray");
    if (grayNode) {
      grayNode.active = gray;
    } else {
      if (!gray) return;
      grayNode = instantiate(this.grayPrefab);
      grayNode.name = "gray";
      this.node.addChild(grayNode);
    }
  }

  getGray() {
    return this.isGray;
  }

  onClick(cb: typeof this.onClickCallback) {
    this.onClickCallback = cb;
  }

  /**
   * 播放创建动画
   */
  playCreateAnim() {
    this.node.setScale(0, 0);
    tween(this.node)
      .delay(Tile.createTime)
      .to(
        0.5,
        { scale: new Vec3(this.scale, this.scale, this.scale) },
        {
          easing: "backOut",
        }
      )
      .start();
  }

  /**
   * 播放动画 - 先放大再还原
   */
  playPlusAnim() {
    tween(this.node)
      .to(
        0.3,
        {
          scale: new Vec3(1.2 * this.scale, 1.2 * this.scale, 1.2 * this.scale),
        },
        {
          easing: "sineOut",
        }
      )
      .to(
        0.3,
        { scale: new Vec3(this.scale, this.scale, this.scale) },
        {
          easing: "backOut",
        }
      )
      .start();
    return this;
  }
  /**
   * 输入x,y  获取位置
   */
  getPosition(x: number, y: number) {
    return Tile.getTilePosition(x, y, this.size);
  }
  public static getSpace() {
    return 10; // 间隔
  }
  public static getTilePosition(x: number, y: number, size: number) {

    const space = Tile.getSpace(); // 间隔
    return new Vec3(
      x * (size + space) + (0.5 * size + space),
      y * (size + space) + (0.5 * size + space)
    );
  }
  /**
   * 移动Tile并在反方向添加尾焰效果
   * @param x 目标x坐标
   * @param y 目标y坐标
   * @param cb 移动完成后的回调函数
   */
  moveTile(x: number, y: number, cb?: Function) {
    // 计算移动方向
    const dirX = this.x - x;
    const dirY = this.y - y;

    // 保存初始位置用于插值计算
    const endPos = this.getPosition(x, y);

    tween(this.node)
      .to(
        Tile.moveTime,
        { position: endPos },
        {
          easing: "linear",
        }
      )
      .call(() => {
        this.x = x;
        this.y = y;


        cb && cb();
      })
      .start();
  }


  onDestroy() {
    if (this.clickable) {
      this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
    this.onClickCallback = null;
  }

  /**
   * 销毁Tile
   */
  destroyTile() {
    // 销毁方块
    this.node.destroy();
  }
}

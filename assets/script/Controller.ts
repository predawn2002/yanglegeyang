import { _decorator, Node, instantiate, tween, v3, sys, Label, Prefab, Component, AudioSource } from "cc";
import { Tile } from "./Tile";
const { ccclass, property } = _decorator;
import { tileSize, shapesFn } from "./config";
@ccclass("GameController")
export class GameController extends Component {
  @property({ type: Prefab })
  tilePrefab: Prefab = null!; // 单个方块预制体
  @property({ type: Node })
  public gridNode: Node = null!;
  @property({ type: Node })
  public storeNode: Node = null!;
  @property({ type: Node })
  public storeNode2: Node = null!;
  @property({ type: Node })
  public winNode: Node = null!;
  @property({ type: Node })
  public touchNode: Node = null!;
  @property({ type: Node })
  public alertNode: Node = null!;
  @property({ type: Node })
  public overNode: Node = null!;
  @property({ type: Node })
  public retryNode: Node = null!;
  @property(AudioSource)
  bgMusic: AudioSource = null;
  @property(AudioSource)
  clickMusic: AudioSource = null;
  @property(AudioSource)
  mergeMusic: AudioSource = null!; // 消除音效
  private storeTile: Tile[] = [];
  private storeTile2: Tile[] = [];
  private available = true;
  private level = 0;
  private totalTile = 0;

  private gridData: {
    x: number;
    y: number;
    v: number;
    ox: number;
    oy: number;
    gray?: boolean;
    repeat?: boolean;
  }[][] = [];
  onLoad() {
    this.retryNode.on(Node.EventType.TOUCH_END, () => this.reset(), this);
    this.winNode.getChildByName('retry').on(Node.EventType.TOUCH_END, () => this.reset(), this);
  }
  protected start(): void {
    this.reset()
  }
  showWin() {
    this.winNode.active = true;
  }
  reset(level: number = 0): void {
    this.overNode.active = false;
    this.winNode.active = false;
    this.level = level;
    this.storeTile = [];
    this.storeTile2 = [];
    this.initData();
    this.checkGray();
    this.initGrid();
    this.available = true;
  }

  /**
   * 生成一个在指定范围内随机数
   * @param min 最小值
   * @param max 最大值
   * @returns 符合条件的随机数
   */
  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  initData() {
    this.gridData = [];
    const d = new Date();
    const shape =
      this.level === 0
        ? shapesFn[0]()
        : shapesFn[1]();
    this.totalTile = shape.reduce((pre, cur) => pre + cur.length, 0);
    console.log(this.totalTile);
    const numbers = [];
    while (numbers.length < this.totalTile) {
      const threeNumbers = this.getRandomNumber(1, 19);
      numbers.push(threeNumbers, threeNumbers, threeNumbers);
    }
    numbers.sort(() => Math.random() - 0.5);
    for (let layer of shape) {
      for (let grid of layer) {
        grid.v = numbers.pop();
      }
    }
    this.gridData = shape;
  }
  createTile(grid, disableAnim?: boolean) {
    const tile = instantiate(this.tilePrefab);
    const tileScrip = tile.getComponent(Tile);
    tileScrip.initTile(
      {
        value: grid.v,
        x: grid.x,
        y: grid.y,
        size: tileSize,
        noPosition: true,
        disableAnim,
      }
    );
    const pos = tileScrip.getPosition(
      grid.x + (grid.ox || 0),
      grid.y + (grid.oy || 0),
    );
    tile.setPosition(pos);
    tileScrip.setGray(grid.gray);
    tileScrip.onClick(this.onTileClick.bind(this));
    return tile;
  }

  initGrid() {
    this.gridNode.destroyAllChildren();
    this.storeNode.destroyAllChildren();
    this.storeNode2.destroyAllChildren();
    this.touchNode.children.forEach((child) => {
      if (child.name.includes("_")) {
        child.destroy();
      }
    });

    this.gridData.forEach((layer, index) => {
      layer.forEach((grid) => {
        if (grid.repeat) {
          return;
        }
        const tile = this.createTile(grid, false);
        tile.name = `${index}_${grid.x}_${grid.y}`;
        this.gridNode.addChild(tile);
      });
    });
  }
  // 计算是否被遮挡了
  checkGray(update = false) {
    // 从上层到下层检查每个格子是否被遮挡
    for (let i = 0; i < this.gridData.length; i++) {
      const currentLayer = this.gridData[i];
      // 检查当前层的每个格子是否被上层遮挡
      for (let grid of currentLayer) {
        let isGray = false,
          isRepeat = false;

        // 检查所有上层
        for (let j = i + 1; j < this.gridData.length; j++) {
          const upperLayer = this.gridData[j];

          for (let upperGrid of upperLayer) {
            // 计算实际位置
            const currentX = grid.x + (grid.ox || 0);
            const currentY = grid.y + (grid.oy || 0);
            const upperX = upperGrid.x + (upperGrid.ox || 0);
            const upperY = upperGrid.y + (upperGrid.oy || 0);
            // 判断是否重叠/遮挡
            if (
              Math.abs(currentX - upperX) < 1 &&
              Math.abs(currentY - upperY) < 1
            ) {
              isGray = true;
              if (currentX === upperX && currentY === upperY) {
                isRepeat = true;
              }
              break;
            }
          }

          if (isRepeat) break;
        }

        grid.gray = isGray;
        grid.repeat = isRepeat;
        if (update) {
          let tile = this.gridNode.getChildByName(`${i}_${grid.x}_${grid.y}`);
          if (!tile && !grid.repeat) {
            tile = this.createTile(grid, true);
            tile.name = `${i}_${grid.x}_${grid.y}`;
            this.gridNode.insertChild(tile, 0);
          } else {
            const tileScrip = tile?.getComponent(Tile);
            tileScrip?.setGray(grid.gray);
          }
        }
      }
    }
  }
  onTileClick(_, __, tile: Tile) {
    if (
      !this.available ||
      tile.getGray() ||
      this.storeTile.indexOf(tile) > -1 ||
      tile.node.parent === this.storeNode ||
      tile.node.parent === this.touchNode
    )
      return;
    this.clickMusic.play();
    const posInStoreWorld = v3();
    this.storeNode.getWorldPosition(posInStoreWorld);
    // 放到最上层
    const posInWorld = v3();
    tile.node.getWorldPosition(posInWorld);
    tile.node.parent = this.touchNode;
    tile.node.setWorldPosition(posInWorld);

    const index = this.storeTile.length;
    posInStoreWorld.add3f(
      10 + (tileSize + 10) * index + 0.5 * tileSize,
      10 + 0.5 * tileSize,
      0
    );
    const posInStore = tile.getPosition(index, 0);
    if (this.storeTile2.indexOf(tile) > -1) {
      this.storeTile2 = this.storeTile2.filter((t) => t !== tile);
      for (let i = 0; i < this.storeTile2.length; i++) {
        this.storeTile2[i].moveTile(i, 0);
      }
    } else {
      const layer = Number(tile.node.name.split("_")[0]);
      this.gridData[layer] = this.gridData[layer].filter(
        (grid) => grid.x !== tile.x || grid.y !== tile.y
      );
      this.checkGray(true);
    }

    this.storeTile.push(tile);
    const subsetToProcess = this.findSubsets();
    if (subsetToProcess.length > 0) {
      // this.available = false;
    } else {
      if (this.storeTile.length >= 7) {
        this.overNode.active = true;
      } else {
        this.available = true;
      }
    }
    const subsetNode: Node[] = [],
      moveTile: Tile[] = [];
    for (let i = 0; i < this.storeTile.length; i++) {
      if (subsetToProcess.indexOf(i) > -1) {
        subsetNode.push(this.storeTile[i].node);
      } else if (i > Math.min(...subsetToProcess)) {
        moveTile.push(this.storeTile[i]);
      }
    }
    this.storeTile = this.storeTile.filter(
      (tile) => subsetNode.indexOf(tile.node) === -1
    );
    tween(tile.node)
      .to(0.3, { worldPosition: posInStoreWorld })
      .call(() => {
        tile.node.parent = this.storeNode;
        tile.node.setPosition(posInStore);
        this.handleDestroy(subsetNode, moveTile);
      })
      .start();
  }

  /**
   * @returns 找到的三个数字的索引数组 [index1, index2, index3]，如果没有找到则返回空数组
   */
  private findSubsets(): number[] {
    // 遍历所有可能的三元组组合
    for (let i = 0; i < this.storeTile.length - 2; i++) {
      for (let j = i + 1; j < this.storeTile.length - 1; j++) {
        for (let k = j + 1; k < this.storeTile.length; k++) {
          if (
            this.storeTile[i].value === this.storeTile[j].value &&
            this.storeTile[j].value === this.storeTile[k].value
          ) {
            // 找到符合条件的第一组后立即返回
            return [i, j, k];
          }
        }
      }
    }

    // 如果没有找到符合条件的三个数字，返回空数组
    return [];
  }

  handleDestroy(subsetNode: Node[], moveTile: Tile[]) {
    if (subsetNode.length === 0) {
      return;
    }
    const moveSubsetPms = subsetNode.map(
      (node) =>
        new Promise((resolve) => {
          tween(node)
            .to(0.3, { scale: v3(0, 0, 0) })
            .call(() => {
              resolve(null);
            })
            .start();
        })
    );

    this.available = true;
    this.mergeMusic.play();
    Promise.all(moveSubsetPms).then(() => {
      subsetNode.forEach((node) => {
        node.removeFromParent();
        node.destroy();
      });
      for (let i = 0; i < this.storeTile.length; i++) {
        if (moveTile.indexOf(this.storeTile[i]) === -1) {
          continue;
        }
        this.storeTile[i].moveTile(i, 0);
      }
      this.checkWin();
    });
  }
  checkWin() {
    if (
      this.storeNode.children.length > 0 ||
      this.storeNode2.children.length > 0 ||
      this.gridNode.children.length > 0
    ) {
      return;
    }

    if (this.level === 0) {
      this.alertNode.active = true;
      this.alertNode.scale = v3(1, 1, 1);
      this.scheduleOnce(() => {
        this.reset(this.level + 1);
        this.alertNode.active = false;
      }, 0.1);
      return;
    }
    this.winNode.active = true;
    this.showWin();
  }

}

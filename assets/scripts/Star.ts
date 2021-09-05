import { _decorator, Component, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

import Game from "./Game";

@ccclass('Star')
export default class Star extends Component {
    // 星星和主角之间的距离小于这个数值时，就会完成收集
    @property
    private pickRadius = 0;

    // 暂存 Game 对象的引用
    private _game: Game | null = null;
    private _uiOpacity: UIOpacity | null = null;

    onLoad() {
        this.enabled = false;
        this._uiOpacity = this.getComponent(UIOpacity);
    }

    // use this for initialization
    init(game: Game) {
        this._game = game;
        this.enabled = true;
        this._uiOpacity!.opacity = 255;
    }

    reuse(game: Game) {
        this.init(game);
    }

    private _getPlayerDistance() {
        // 根据 player 节点位置判断距离
        const playerPos = this._game!.player!.getCenterPos();
        // 根据两点位置计算两点之间距离
        return Vec3.distance(this.node.position, playerPos);
    }

    private _onPicked() {
        // 调用 Game 脚本的得分方法
        this._game!.gainScore(this.node.getPosition());
        // 当星星被收集时，调用 Game 脚本中的接口，销毁当前星星节点，生成一个新的星星
        this._game!.despawnStar(this.node);
    }

    // called every frame
    update(dt: number) {
        // 每帧判断和主角之间的距离是否小于收集距离
        if (this._getPlayerDistance() < this.pickRadius) {
            // 调用收集行为
            this._onPicked();
            return;
        }
        // 根据 Game 脚本中的计时器更新星星的透明度
        const opacityRatio = 1 - this._game!.timer / this._game!.starDuration;
        const minOpacity = 50;
        this._uiOpacity!.opacity = minOpacity + Math.floor(opacityRatio * (255 - minOpacity));
    }
}
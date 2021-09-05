import { _decorator, Component, Animation, Prefab } from 'cc';
const { ccclass, property } = _decorator;

import Game from "./Game";

@ccclass('ScoreFX')
export default class ScoreFX extends Component {
    @property(Animation)
    private anim: Animation | null = null;

    private _game: Game | null = null;

    init(game: Game) {
        this._game = game;
        this.anim!.getComponent('ScoreAnim')!.init(this);
    }

    despawn() {
        this._game!.despawnScoreFX(this.node);
    }

    play() {
        this.anim!.play('score_pop');
    }
}
import { _decorator, Component, Prefab } from 'cc';
const { ccclass } = _decorator;

@ccclass('ScoreAnim')
export default class ScoreAnim extends Component {
    private _scoreFX: Prefab | null = null;

    init(scoreFX: Prefab) {
        this._scoreFX = scoreFX;
    }

    hideFX() {
        this._scoreFX!.despawn();
        this._scoreFX = null;
    }
}
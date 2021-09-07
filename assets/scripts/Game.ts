import { _decorator, instantiate, sys, AudioClip, AudioSource, Button, Component, Label, Node, Pool, Prefab, UITransform, Vec3, director, Canvas, Tween } from 'cc';
const { ccclass, property } = _decorator;

import Global from "./Global";
import Player from "./Player";
import ScoreFX from "./ScoreFX";
import Star from "./Star";

import SceneTransition from "./SceneTransition";

@ccclass('Game')
export default class Game extends Component {
    // 这个属性引用了星星预制资源
    @property(Prefab)
    private starPrefab: Prefab | null = null;

    @property(Prefab)
    private scoreFXPrefab: Prefab | null = null;

    // 星星产生后消失时间的随机范围
    @property
    private maxStarDuration = 0;

    @property
    private minStarDuration = 0;

    // 地面节点，用于确定星星生成的高度
    @property(Node)
    private ground: Node | null = null;

    // player 节点，用于获取主角弹跳的高度，和控制主角行动开关
    /**
     * @type {Player}
     */
    @property(Player)
    player: Player | null = null;

    // Layer for Star
    @property(Node)
    private layerStar: Node | null = null;

    // score label 的引用
    @property(Label)
    private scoreDisplay: Label | null = null;

    // 音效来源
    @property(AudioSource)
    private audioSource: AudioSource | null = null;

    // 得分音效资源
    @property(AudioClip)
    private scoreAudio: AudioClip | null = null;

    // 得分音效资源 1
    @property(AudioClip)
    private scoreAudio1: AudioClip | null = null;

    @property(Button)
    private btnNode: Button | null = null;

    @property(Node)
    private gameOverNode: Node | null = null;

    @property(Label)
    private controlHintLabel: Label | null = null;

    @property({
        multiline: true
    })
    private keyboardHint = '';

    @property({
        multiline: true
    })
    private touchHint = '';

    timer = 0;
    starDuration = 0;

    private _groundY = 0;
    private _currentStar: Node | null = null;
    private _currentStarX = 0;  // TODO: need to check
    private _isPlaying = false;
    private _starPool: Pool<Node> | null = null;
    private _scorePool: Pool<Node> | null = null;
    private _score = 0;
    private _groundPos: Vec3 = new Vec3();
    private _randStarPos: Vec3 = new Vec3();

    // use this for initialization
    onLoad() {
        console.log('Game.canvas.enabled = ' + this.getComponent(Canvas)!.enabled);
        Global.designW = this.getComponent(UITransform)!.width;
        Global.designH = this.getComponent(UITransform)!.height;

        // 获取地平面的 y 轴坐标
        this._groundY = this.ground!.position.y + this.ground!.getComponent(UITransform)!.height / 2;

        this._groundPos.set(0, this._groundY, 0);

        // store last star's x position
        this._currentStar = null;
        this._currentStarX = 0;

        // 初始化计时器
        this.timer = 0;
        this.starDuration = 0;

        // is showing menu or running game
        this._isPlaying = false;

        // initialize control hint
        this.controlHintLabel!.string = sys.isMobile ? this.touchHint : this.keyboardHint;

        // initialize star and score pool
        this._starPool = new Pool(() => instantiate(this.starPrefab as Prefab), 2);
        this._scorePool = new Pool(() => instantiate(this.scoreFXPrefab as Prefab), 2);
    }

    onStartGame() {
        // 初始化计分
        this._resetScore();
        // set game state to running
        this._isPlaying = true;
        // set button and gameover text out of screen
        this.btnNode!.node.setPosition(3000, 0, 0);
        this.gameOverNode!.active = false;
        // reset player position and move speed
        this.player!.startMoveAt(this._groundPos);
        // spawn star
        this._spawnNewStar();
    }

    private _spawnNewStar() {
        // 使用给定的模板在场景中生成一个新节点        
        const newStar = this._starPool!.alloc();
        newStar.setPosition(this._getNewStarPosition());
        // 将新增的节点添加到 Canvas 节点下面
        this.layerStar!.addChild(newStar);
        // pass Game instance to star
        newStar.getComponent(Star)!.init(this);
        // start star timer and store star reference
        this._startTimer();
        this._currentStar = newStar;
    }

    despawnStar(star: Node) {
        star.removeFromParent();
        this._starPool!.free(star);
        this._spawnNewStar();
    }

    private _startTimer() {
        // get a life duration for next star
        this.starDuration = this.minStarDuration + Math.random() * (this.maxStarDuration - this.minStarDuration);
        this.timer = 0;
    }

    private _getNewStarPosition() {
        // 根据地平面位置和主角跳跃高度，随机得到一个星星的 y 坐标
        const randY = this._groundY + Math.random() * this.player!.jumpHeight + 50;
        // 根据屏幕宽度，随机得到一个星星 x 坐标
        let randX = 80 + Math.random() * ((Global.designW / 2) - 110);
        randX = (Math.random() < 0.5) ? -randX : randX;
        // 返回星星坐标
        this._randStarPos.set(randX, randY);

        return this._randStarPos;
    }

    gainScore(pos: Vec3) {
        this._score += 1;
        // 更新 scoreDisplay Label 的文字
        this.scoreDisplay!.string = 'Score: ' + this._score.toString();
        const fx = this._spawnScoreFX();
        this.layerStar!.addChild(fx.node);
        fx.node.setPosition(pos);
        // 播放特效
        fx.play();

        let audioClip = this.scoreAudio;
        // 播放得分音效
        if (Math.floor(Math.random() * 2) == 0) {
            audioClip = this.scoreAudio1;
        }
        this.audioSource!.playOneShot(audioClip as AudioClip, 1);
    }

    private _resetScore() {
        this._score = 0;
        this.scoreDisplay!.string = 'Score: ' + this._score.toString();
    }

    private _spawnScoreFX(): ScoreFX {
        const node = this._scorePool!.alloc();
        const fx = node.getComponent(ScoreFX);
        fx!.init(this);

        return fx as ScoreFX;
    }

    private _gameOver() {
        this.gameOverNode!.active = true;
        this.player!.enabled = false;
        this.player!.stopMove();
        this._currentStar?.destroy();
        this._currentStar = null;
        this._isPlaying = false;
        this.btnNode!.node.setPosition(0, this.btnNode!.node.position.y);
    }

    despawnScoreFX(scoreFX: Node) {
        scoreFX.removeFromParent();
        this._scorePool!.free(scoreFX);
    }

    // called every frame
    update(dt: number) {
        if (!this._isPlaying) {
            return;
        }

        this.player!.myUpdate(dt);

        // 每帧更新计时器，超过限度还没有生成新的星星
        // 就会调用游戏失败逻辑
        if (this.timer > this.starDuration) {
            this._gameOver();
            return;
        }
        this.timer += dt;
    }

    onExitClicked() {
        this._isPlaying = false;
        this.player!.stopMove();
        this.audioSource!.stop();

        director.preloadScene("mainmenu", function () {
            console.log('Back to Main Menu');
            SceneTransition.switchSceneFadeInOut('mainmenu');
        });
    }

    onDestroy() {
        console.log("Game onDestroy!");
        this._starPool!.destroy();
        this._scorePool!.destroy();
    }

}
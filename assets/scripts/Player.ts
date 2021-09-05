import {
    _decorator, tween, Component, AudioClip, AudioSource, KeyCode, Node, Size,
    systemEvent, SystemEvent, Tween, UITransform, Vec3, EventMouse, EventTouch, EventKeyboard
} from 'cc';
const { ccclass, property } = _decorator;

import Global from "./Global";

@ccclass('Player')
export default class Player extends Component {
    // 主角跳跃高度
    @property
    jumpHeight = 0;

    // 主角跳跃持续时间
    @property
    private jumpDuration = 0;

    // 辅助形变动作时间
    @property
    private squashDuration = 0;

    // 最大移动速度
    @property
    private maxMoveSpeed = 0;

    // 加速度
    @property
    private accel = 0;

    // 音效来源
    @property(AudioSource)
    private audioSource: AudioSource | null = null;

    // 跳跃音效资源
    @property(AudioClip)
    private jumpAudio: AudioClip | null = null;

    // 加速度方向开关
    private _accLeft = false;
    private _accRight = false;

    private _centerPos: Vec3 = new Vec3();

    // 主角当前水平方向速度
    private _xSpeed = 0;

    // screen boundaries
    private _minPosX = 0;
    private _maxPosX = 0;

    private _myWidth = 0;
    private _myHeight = 0;

    private _isTweenJumpReady: boolean = false;
    private _tweenJump!: Tween<Node>;
    private _tweenJumpObj = { scale: new Vec3(Vec3.ONE), position: new Vec3() };

    // use this for initialization
    onLoad() {
        this.enabled = false;
        this._myWidth = this.getComponent(UITransform)!.width;
        this._myHeight = this.getComponent(UITransform)!.height;

        // compute screen boundaries
        this._minPosX = -Global.designW / 2;
        this._maxPosX = Global.designW / 2;

        // 初始化键盘输入监听
        this._setInputControl();
    }

    private _setInputControl() {
        // add keyboard input listener to jump left and right
        systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        // add mouse input listener to jump left and righ
        systemEvent.on(SystemEvent.EventType.MOUSE_DOWN, this.onMouseDown, this);
        systemEvent.on(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);

        // touch input
        this.node!.parent!.on(Node.EventType.TOUCH_START, this.onTouchBegan, this);
        this.node!.parent!.on(Node.EventType.TOUCH_END, this.onTouchEnded, this);
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this._accLeft = true;
                this._accRight = false;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this._accLeft = false;
                this._accRight = true;
                break;
        }
    }

    onKeyUp(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_RIGHT:
                this._accLeft = false;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this._accRight = false;
                break;
        }
    }

    onTouchBegan(event: EventMouse | EventTouch): boolean {
        const touchLoc = event.getUILocation();

        if (touchLoc.x > Global.designW / 2) {
            this._accLeft = false;
            this._accRight = true;
        } else {
            this._accLeft = true;
            this._accRight = false;
        }
        // don't capture the event
        return true;
    }

    onTouchEnded(event: EventMouse | EventTouch) {
        this._accLeft = false;
        this._accRight = false;
    }

    onMouseDown(event: EventMouse) {
        this.onTouchBegan(event);
    }

    onMouseUp(event: EventMouse) {
        this.onTouchEnded(event);
    }

    private _setupJumpAction() {
        Vec3.copy(this._tweenJumpObj.scale, Vec3.ONE);
        Vec3.copy(this._tweenJumpObj.position, this.node.position);

        if (this._isTweenJumpReady)
            return;
        this._isTweenJumpReady = true;

        const that = this;

        // 创建一个缓动
        this._tweenJump = tween(this._tweenJumpObj)
            // 按顺序执行动作
            // 形变
            .to(this.squashDuration, { scale: new Vec3(1, 0.6, 0) })
            .to(this.squashDuration, { scale: new Vec3(1, 1.2, 0) })
            // 跳跃上升
            .by(this.jumpDuration, { position: new Vec3(0, this.jumpHeight, 0) }, { easing: 'sineOut' })
            // 形变
            .to(this.squashDuration, { scale: new Vec3(1, 1, 0) })
            // 下落
            .by(this.jumpDuration, { position: new Vec3(0, -this.jumpHeight, 0) }, { easing: 'sineIn' })
            // 添加一个回调函数，在前面的动作都结束时调用我们定义的方法
            .call(() => {
                that.audioSource!.playOneShot(that.jumpAudio as AudioClip, 1);
            })
            .union()
            // 不断重复
            .repeatForever();
    }

    getCenterPos() {
        this._centerPos.set(this.node.position.x, this.node.position.y + this._myHeight / 2, 0);
        return this._centerPos
    }

    startMoveAt(pos: Vec3) {
        this.enabled = true;
        this._xSpeed = 0;
        this.node.setPosition(pos);

        // 初始化跳跃动作
        this._setupJumpAction();

        this._tweenJump.start();
    }

    stopMove() {
        this._tweenJump.stop();
    }

    // called every frame
    update(dt: number) {
        // 根据当前加速度方向每帧更新速度
        if (this._accLeft) {
            this._xSpeed -= this.accel * dt;
        } else if (this._accRight) {
            this._xSpeed += this.accel * dt;
        }

        // 限制主角的速度不能超过最大值
        if (Math.abs(this._xSpeed) > this.maxMoveSpeed) {
            // if speed reach limit, use max speed with current direction
            this._xSpeed = this.maxMoveSpeed * this._xSpeed / Math.abs(this._xSpeed);
        }

        // 根据当前速度更新主角的位置
        this.node.setPosition(this.node.position.x + this._xSpeed * dt, this._tweenJumpObj.position.y);
        this.node.setScale(this._tweenJumpObj.scale);

        // limit player position inside screen
        if (this.node.position.x > Global.designW / 2) {
            this.node.setPosition(Global.designW / 2, this.node.position.y, 0);
            this._xSpeed = 0;
        } else if (this.node.position.x < -Global.designW / 2) {
            this.node.setPosition(-Global.designW / 2, this.node.position.y, 0);
            this._xSpeed = 0;
        }
    }

    onDestroy() {
        // add keyboard input listener to jump left and right
        systemEvent.off(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        // add mouse input listener to jump left and righ
        systemEvent.off(SystemEvent.EventType.MOUSE_MOVE, this.onMouseDown, this);
        systemEvent.off(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);

        // touch input
        this.node!.parent!.off(Node.EventType.TOUCH_START, this.onTouchBegan, this);
        this.node!.parent!.off(Node.EventType.TOUCH_END, this.onTouchEnded, this);
    }
}
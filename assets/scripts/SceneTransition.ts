
import { _decorator, Component, Node, game, UIOpacity, Tween, tween, AudioClip, director } from 'cc';
const { ccclass } = _decorator;
 
@ccclass('SceneTransition')
export default class SceneTransition extends Component {
    private _uiOpacity: UIOpacity | null = null;
    private _tweenSwitchFadeIn: Tween<UIOpacity> | null = null;
    private _tweenSwitchFadeOut: Tween<UIOpacity> | null = null;
    private _nextSceneName: string = '';
    private static _myself: SceneTransition | null = null;

    // [1]
    // dummy = '';

    // [2]
    // @property
    // serializableDummy = 0;

    start () {
        // [3]
    }

    // update (deltaTime: number) {
    //     // [4]
    // }

    onLoad () {
        console.log('SceneTransition onLoad');
        this._uiOpacity = this.getComponent(UIOpacity);
        this._uiOpacity!.opacity = 0;
        game.addPersistRootNode(this.node);
        
        SceneTransition._myself = this;
        this.node.active = false;

        this._tweenSwitchFadeIn = tween(this._uiOpacity)
            // fade in
            .to(0.2, { opacity: 255 })
            .call(() => {
                const that = SceneTransition._myself;
                console.log('transition - loading scene');
                that!.node.off(Node.EventType.TOUCH_START, that!.onTransitionLayerTouched, that);
                director.loadScene(that!._nextSceneName, that!.onSceneLaunched);
            })

        this._tweenSwitchFadeOut = tween(this._uiOpacity)
            // fade out
            .to(0.3, { opacity: 0 })
            .call(() => {
                const that = SceneTransition._myself;
                that!.node.active = false;
                console.log('transition - off events');
            });
    }

    onTransitionLayerTouched () {
        console.log('onTransitionLayerTouched');
    }

    static switchSceneFadeInOut (sceneName: string) {
        const that = SceneTransition._myself;
        that!._nextSceneName = sceneName;
        that!.node.active = true;
        that!.node.on(Node.EventType.TOUCH_START, that!.onTransitionLayerTouched, that);
        that!._tweenSwitchFadeIn!.start();
    }

    onSceneLaunched () {
        const that = SceneTransition._myself;
        that!._tweenSwitchFadeOut!.start();
    }

    onDestroy () {
        console.log('SceneTransition destroyed!');
    }
}

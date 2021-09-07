
import { _decorator, Component, Node, log, director, Button, EventTouch, Canvas } from 'cc';
const { ccclass, property } = _decorator;

import SceneTransition from "./SceneTransition";

@ccclass('MainMenu')
export class MainMenu extends Component {
    @property(Node)
    private nodeDark: Node | null = null;

    // [1]
    // dummy = '';

    // [2]
    // @property
    // serializableDummy = 0;

    start () {
        // [3]
    }

    enterClicked (event: EventTouch, data: any) {
        console.log(data as number);
        const button = (event.target as Component)!.getComponent(Button);
        this.nodeDark!.active = true;
        this.nodeDark!.on(Node.EventType.TOUCH_START, this.darkLayerTouched, this);

        const that = this;
        director.preloadScene('game', function () {
            console.log('Next scene preloaded');
            that.scheduleOnce(function() {
                SceneTransition.switchSceneFadeInOut('game');
            }, 1);
        });
    }

    darkLayerTouched () {
        console.log('darkLayerTouched');
    }

    // update (deltaTime: number) {
    //     // [4]
    // }

    onDestroy () {
        console.log('MainMenu destroyed!');
    }
}


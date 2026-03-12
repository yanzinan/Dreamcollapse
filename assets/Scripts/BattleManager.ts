import { _decorator, Component, Node, find, AudioSource } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {

    // loading 实例
    @property(Node)
    public LoadingMask:Node = null;

    // 加载动画组件
    private dotdTypeA:Animation = null;

    @property(AudioSource)
    bgAudioSource: AudioSource = null!;

    onLoad(){

    }

    start() {
        // 播放背景音乐
        this.bgAudioSource.play();
        // 设置节点为激活状态（显示）
        // this.LoadingMask.active = true;
    }

    update(deltaTime: number) {
        
    }

}



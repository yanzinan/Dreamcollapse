import { _decorator, Component, Node, find, AudioSource, Prefab, instantiate, director, input, Input, } from 'cc';
const { ccclass, property } = _decorator;

import GlobalData from './GlobalData';

@ccclass('BattleManager')
export class BattleManager extends Component {

    // loading 预制体
    @property(Prefab)
    LoadingMask:Prefab = null;

    // loading实例
    private LoadingMaskNode:Node = null;

    // 加载动画组件
    private dotdTypeA:Animation = null;

    @property(AudioSource)
    bgAudioSource: AudioSource = null!;

    onLoad(){
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);

        console.log(GlobalData.initParam)
    }

    start() {
        // 播放背景音乐
        this.bgAudioSource.play();
        
    }

    update(deltaTime: number) {
        
    }

    // 创建loading动画实例
    createProgressBar(){
        // 实例化进度条
        this.LoadingMaskNode = instantiate(this.LoadingMask);
        // 获取Canvas节点（确保进度条显示在UI层）
        const canvas = director.getScene()?.getChildByName("Canvas");
        if (canvas) {
            this.LoadingMaskNode.parent = canvas;
            // 可选：设置进度条位置居中
            this.LoadingMaskNode.setPosition(0, 0);
        }
    }

    // 触摸开始
    onTouchStart(){
        if(this.LoadingMaskNode){
            this.LoadingMaskNode.destroy()
        }
        this.createProgressBar()
    }

    onDestroy(){
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

}



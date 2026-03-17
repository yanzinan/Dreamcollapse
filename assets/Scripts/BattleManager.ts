import { _decorator, Component, Node, find, AudioSource, Prefab, instantiate, director, input, Input, Label, Button, } from 'cc';
const { ccclass, property } = _decorator;

import { http } from './NetworkManager';
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

    private GameInitData = null;

    // 剧情label
    @property(Label)
    plot:Label = null;

    // 点击继续label
    @property(Button)
    clickToContinue:Button = null;

    // button内的text
    @property(Label)
    clickToContinueText:Label = null;

    // 当前显示的文本索引
    private currentIndex: number = 0;

    // 打字机定时器
    private typewriterTimer: number = -1;

    // 打字机速度（毫秒/字）
    private typeSpeed: number = 150;

    // 当前正在拼接的文本
    private currentText: string = "";

    // 播放键盘音
    @property(AudioSource)
    keyboard:AudioSource = null;

    onLoad(){
        
        // 获取全局存储中的参数
        // console.log(GlobalData.initParam)
        this.createProgressBar()
        this.GameInit()

        // 初始化将文字内容置空
        this.plot.string = '';
        this.clickToContinueText.string = '';
        this.clickToContinue.interactable  = false;
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

    onDestroy(){
         // 销毁时清理定时器和监听，防止内存泄漏
         if (this.typewriterTimer !== -1) {
            clearInterval(this.typewriterTimer);
        }
    }

    // GameInit
    async GameInit() {
        try {
            const result = await http.post<{code:Number,data:any }>('agent-list-hot', {});
            this.GameInitData = result.data
            // 将loading动画清除
            this.LoadingMaskNode.destroy()
            // 将拿到的内容展示在游戏界面
            await this.storyShow()
        } catch (error: any) {
            console.error('登录失败:', error.message);
        }
    }

    // 展示剧情
    async storyShow(){
        console.log(this.GameInitData)
        // 开始显示第一段文本
        this.startTypewriter(this.GameInitData[this.currentIndex].digest);
    }

    /**
     * 启动打字机效果
     * @param targetText 要显示的目标文本
     */
    private startTypewriter(targetText: string) {
        // 清空原有文本
        this.currentText = "";
        this.plot.string = "";

        // 停止之前的定时器（防止重复）
        if (this.typewriterTimer !== -1) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = -1;
        }

        // 记录当前要拼接的文本长度
        let textLength = 0;

        // 启动定时器逐字拼接
        this.typewriterTimer = setInterval(() => {
            // 拼接一个字
            this.currentText = targetText.substring(0, textLength + 1);
            this.plot.string = this.currentText;
            textLength++;

            this.keyboard.play()

            // 文本拼接完成后停止定时器
            if (textLength >= targetText.length) {
                clearInterval(this.typewriterTimer);
                this.typewriterTimer = -1;
            }
        }, this.typeSpeed);

        this.clickToContinueText.string = '点击继续查看';
        this.clickToContinue.interactable  = true;
    }

    /**
     * 监听屏幕点击事件
     */
    private onClickContinue() {
        // 如果打字机还在运行，直接完成当前文本显示
        if (this.typewriterTimer !== -1) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = -1;
            this.plot.string = this.GameInitData[this.currentIndex].digest;
            return;
        }

        // 文本显示完成后，切换下一段
        this.currentIndex++;
        if (this.currentIndex < this.GameInitData.length) {
            // 清空当前文本（模拟“消失”效果）
            this.plot.string = "";
            // 延迟一小段时间再显示下一段（提升体验）
            setTimeout(() => {
                this.startTypewriter(this.GameInitData[this.currentIndex].digest);
            }, 300);
        } else {
            // 所有文本显示完毕，可做后续逻辑（如关闭对话框、跳转场景等）
            console.log("所有对话显示完成");
            this.plot.string = "";
            this.clickToContinueText.string = '';
            this.clickToContinue.interactable  = false;
        }
    }

}



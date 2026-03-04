import { _decorator, Button, Component, Node, Prefab, Sprite, ProgressBar, instantiate, director } from 'cc';
const { ccclass, property } = _decorator;

import { http } from './NetworkManager';

@ccclass('HomeMananger')
export class HomeMananger extends Component {

    // 开始游戏按钮
    @property(Button)
    GameStart:Button = null;

    // 进度条预制体
    @property(Prefab)
    HomeLoading:Prefab = null;

    // 战斗场景
    @property(String)
    battleSceneName: string = "BattleScene";

    // 进度条实例
    private progressBarNode: Node | null = null;

    // 进度条组件
    private progressBar: ProgressBar | null = null;

    onLoad(){
        this.GameStart.node.on(Button.EventType.CLICK,this.onGameStart,this)
    }

    start() {

    }

    update(deltaTime: number) {
        
    }

    onDestroy(){
        // this.GameStart.node.off(Button.EventType.CLICK,this.onGameStart,this)
        // 销毁进度条（防止场景销毁时进度条残留）
        this.destroyProgressBar();
    }

    // 点击开始游戏
    onGameStart() {
        console.log("点击了开始游戏")
        this.guestLogin()
        // 核心：将按钮设置为不可用
        this.GameStart.interactable = false;

        // 可选：修改按钮透明度，增强禁用视觉效果
        const buttonSprite = this.GameStart.node.getComponent(Sprite);
        if (buttonSprite) {
            buttonSprite.color = buttonSprite.color.set(128); // 透明度设为50%（0-255范围）
        }
    }

    // 游客登录测试
    async guestLogin() {
        try {
            const result = await http.post<{code:Number,data:any }>('auth-login-guest', {});
            http.setToken(result.data.token)
            // 1. 实例化进度条预制体（添加到Canvas下，确保显示在最上层）
            this.createProgressBar();

            // 2. 开始预加载战斗场景
            this.preloadBattleScene();
            
        } catch (error: any) {
            console.error('登录失败:', error.message);
        }
    }

    // 创建进度条实例
    createProgressBar(){
        // 实例化进度条
        this.progressBarNode = instantiate(this.HomeLoading);
        // 获取Canvas节点（确保进度条显示在UI层）
        const canvas = director.getScene()?.getChildByName("Canvas");
        if (canvas) {
            this.progressBarNode.parent = canvas;
            // 可选：设置进度条位置居中
            this.progressBarNode.setPosition(0, -167.41);
        }

        // 获取ProgressBar组件
        this.progressBar = this.progressBarNode.getComponent(ProgressBar);
        if (this.progressBar) {
            // 初始化进度为0
            this.progressBar.progress = 0;
        }
    }

    // 预加载战斗场景
    preloadBattleScene(){
        // 预加载场景资源
        director.preloadScene(
            this.battleSceneName,
            // 加载进度回调（关键：获取实时加载进度）
            (completedCount: number, totalCount: number, item: any) => {
                // 计算加载进度（0-1之间）
                const progress = completedCount / totalCount;
                // 修复：避免进度值超过1（极端情况可能出现）
                const safeProgress = Math.min(progress, 1);
                // 更新进度条
                if (this.progressBar) {
                    this.progressBar.progress = safeProgress;
                    console.log(`加载进度：${(safeProgress * 100).toFixed(1)}%`);
                }
            },
            // 加载完成回调
            (err: Error | null) => {
                if (err) {
                    console.error("场景加载失败：", err);
                    // 加载失败恢复按钮状态
                    this.GameStart.interactable = true;
                    // 销毁进度条
                    this.destroyProgressBar();
                    return;
                }

                console.log("战斗场景加载完成，准备跳转！");
                
                // 3. 销毁进度条
                this.destroyProgressBar();

                // 4. 跳转到战斗场景
                director.loadScene(this.battleSceneName);

                // 恢复按钮状态（可选，若跳转后当前场景销毁则无需）
                this.GameStart.interactable = true;
            }
        );
    }

    /**
     * 销毁进度条
     */
    destroyProgressBar() {
        if (this.progressBarNode) {
            // 销毁进度条节点
            this.progressBarNode.destroy();
            // 清空引用，防止内存泄漏
            this.progressBarNode = null;
            this.progressBar = null;
        }
    }
}



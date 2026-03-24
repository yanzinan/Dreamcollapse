import { _decorator, Component, Node, find, AudioSource, Prefab, instantiate, director, input, Input, Label, Button, } from 'cc';
const { ccclass, property } = _decorator;

import { http } from './NetworkManager';
import GlobalData from './GlobalData';
import { UIManager } from './UIManager'; // 你的弹窗管理器

import { DifficultyPanel, DifficultyType } from './DifficultyPanel';

@ccclass('BattleManager')
export class BattleManager extends Component {

    @property(AudioSource)
    bgAudioSource: AudioSource = null!;

    // 游戏难度预制体
    @property(Prefab)
    difficultyPanelPrefab: Prefab = null;

    // 接口请求loading动画预制体
    @property(Prefab)
    RequestLoading:Prefab = null;

    // loading动画实例
    private RequestLoadingNode:Node = null;

    onLoad(){
        // 场景初始化：生成难度选择面板
        this.createDifficultyPanel();
    }

    start() {
        // 播放背景音乐
        this.bgAudioSource.play();
        
    }

    update(deltaTime: number) {
        
    }

    onDestroy(){
        
    }

    /**
     * 实例化难度选择预制体
     */
    private createDifficultyPanel() {
        const panelNode = instantiate(this.difficultyPanelPrefab);
        // 挂载到当前节点下（自动显示）
        panelNode.setParent(this.node);

        // 获取面板脚本
        const panel = panelNode.getComponent(DifficultyPanel);
        if (panel) {
            // 注册回调：接收选中的难度
            panel.onDifficultySelected = (type: DifficultyType) => {
                // 将参数存储到全局
                GlobalData.difficulty = type
                // 展示loading
                this.createLoading()
                // 传递难度参数给后台
                this.GameInit()
            };
        }
    }

    // GameInit
    async GameInit() {
        try {
            let paramIn = {
                "event": {
                  "type": "init"
                },
                "session": {
                  "session_id": "session_" + GlobalData.id,
                  "player_count": 1,
                  "difficulty": "NORMAL"
                },
                "time": {
                  "hard_limit_seconds": GlobalData.hard_limit_seconds,
                  "elapsed_active_seconds": GlobalData.elapsed_active_seconds,
                  "remaining_seconds": GlobalData.hard_limit_seconds - GlobalData.elapsed_active_seconds
                },
                "seed": {
                  "run_seed": "run_" + GlobalData.id
                },
                "constraints": {
                  "language": "cn",
                  "content_rating": "PG",
                  "max_chars_scene": 220,
                  "max_chars_option": 14,
                  "forbidden_terms": ["骰子", "扑克", "点数", "规则"]
                },
                "slots": {
                  "tone_bias": GlobalData.tone_bias,
                  "theme_bias": GlobalData.theme_bias,
                  "npc_bias": GlobalData.npc_bias
                },
                "client_context": {
                  "platform": "miniprogram",
                  "locale": "zh-CN"
                },
                "payload": {},
                "context": {}
            }
            const result = await http.post<{code:Number,data:any }>('invoke', paramIn);
            console.log(result)
            // 销毁loading
            this.RequestLoadingNode.destroy()
            // 将参数存储到全局中，以便接下来使用
            GlobalData.initParam = result.data;
            
        } catch (error: any) {
            console.error('invoke失败:', error);
            // ======================
            // 捕获 502 弹出预制体弹窗
            // ======================
            if (error.code === 502) {
                // 销毁loading
                this.RequestLoadingNode.destroy()
                
                UIManager.instance.showNetErrorPopup(
                    // 重试按钮
                    () => {
                        this.GameInit(); // 重新初始化
                    },
                    // 关闭按钮 → 退回首页
                    () => {
                        // 在这里写返回首页逻辑
                        // 例：
                        director.loadScene("Home");
                        console.log("返回首页");
                    }
                );
            }
        }
    }

    // 创建loading动画实例
    createLoading(){
        // 实例化进度条
        this.RequestLoadingNode = instantiate(this.RequestLoading);
        // 获取Canvas节点（确保进度条显示在UI层）
        const canvas = director.getScene()?.getChildByName("Canvas");
        if (canvas) {
            this.RequestLoadingNode.parent = canvas;
            // 可选：设置进度条位置居中
            this.RequestLoadingNode.setPosition(0, 0);
        }
    }

}



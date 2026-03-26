import { _decorator, Component, Node, find, AudioSource, Prefab, instantiate, director, input, Input, Label, Button, game, Game} from 'cc';
const { ccclass, property } = _decorator;
// 网络请求
import { http } from './NetworkManager';
// 全局数据存储
import GlobalData from './GlobalData';
// 请求接口报502提示框
import { UIManager } from './UIManager'; // 你的弹窗管理器
// 游戏难度选择
import { DifficultyPanel, DifficultyType } from './DifficultyPanel';
// 剧情展示
import { PlotController } from './PlotController';

@ccclass('BattleManager')
export class BattleManager extends Component {

    // 游戏难度预制体
    @property(Prefab)
    difficultyPanelPrefab: Prefab = null;

    // 接口请求loading动画预制体
    @property(Prefab)
    RequestLoading:Prefab = null;

    // loading动画实例
    private RequestLoadingNode:Node = null;

    // 剧情控制器
    private plotController: PlotController = null!;

    // ========== 配置项：全部集中在这里 ==========
    // 标题字段（单独展示）
    private readonly TITLE_FIELD = 'title';
    // 内容展示字段（打字机）
    // init事件字段配置
    private readonly CONTENT_FIELDS_INIT = [
        'memory_summary',
        'player_role',
        'primary_goal',
        'stakes',
        'scene'
    ];
    // decision事件字段配置
    private readonly CONTENT_FIELDS_DECISION = [
        'memory_summary',
        'outcome',
        'summary'
    ];
    // puzzle 事件字段配置
    private readonly CONTENT_FIELDS_PUZZLE = [
        "memory_summary",
        "riddle",
        "key_fact",
        "consequence",
        "summary"
    ]

    // 计算游戏活跃时间
    @property
    private totalTime: number = 0; // 当前累计整秒数

    private timerActive: boolean = false; // 是否计时
    private accumulatedTime: number = 0; // 用于累加 deltaTime 的小数部分

    onLoad(){
        // 场景初始化：生成难度选择面板
        this.createDifficultyPanel();

        // 初始化计时
        this.totalTime = 0;
        this.accumulatedTime = 0;
        this.timerActive = true;
    }

    start() {
        // 监听 前后台切换 事件
        game.on(Game.EVENT_SHOW, this.onGameShow, this);
        game.on(Game.EVENT_HIDE, this.onGameHide, this);
    }

    update(deltaTime: number) {
        if (!this.timerActive) return;

        // 累加 deltaTime
        this.accumulatedTime += deltaTime;

        // 当累计时间 >= 1 秒时，增加 totalTime
        while (this.accumulatedTime >= 1) {
            this.totalTime += 1;
            this.accumulatedTime -= 1;

            // console.log('当前游戏时间（秒）：', this.totalTime);

            if (this.totalTime >= 300) {
                console.log('游戏结束逻辑')
                break;
            }
        }
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
                // 传递难度参数给后台
                this.GameInit()
            };
        }
    }

    // init事件
    async GameInit() {
        // 请求接口 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()

        try {
            let paramIn = {
                "event": {
                  "type": "init"
                },
                "session": {
                  "session_id": "session_" + GlobalData.id,
                  "player_count": 1,
                  "difficulty": GlobalData.difficulty
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
            // 恢复计时
            this.timerActive = true;
            // 将参数存储到全局中，以便接下来使用
            GlobalData.initParam = result.data;

            // 展示剧情
            // 获取控制器
            this.plotController = find('Canvas/PlotRoot')!.getComponent(PlotController)!;

            // ========== 数据解析全部在这里 ==========
            const aiState = result.data.ai_state;
            const payload = result.data.payload;

            // 1. 提取标题
            const title = aiState[this.TITLE_FIELD] || '';

            // 2. 提取内容段落
            const contentLines: string[] = [];
            this.CONTENT_FIELDS_INIT.forEach(field => {
                const content = aiState[field] ?? payload.mainline[field] ?? payload.opening[field];
                if (content) contentLines.push(content);
            });

            // 3. NPC台词
            const npcLine = payload.opening.npc_line;

            // 4. 提示文字
            const tipText = payload.start_hint.how_to_play_next;

            // 5. 选项
            const options = payload.options.map((o: any) => ({
                id: o.id,
                text: o.text
            }));

            // ========== 交给展示层 ==========
            this.plotController.setOptionData(tipText, options);
            this.plotController.startPlayPlot(title, contentLines, npcLine, (selectId) => {
                // 选择后，携带ID重新请求
                console.log(selectId);
                console.log('当前已玩：' + this.totalTime)

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'decision'){
                    this.GameDecision(selectId)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'puzzle'){
                    this.GamePuzzle(selectId)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'combat'){
                    this.GameCombat(selectId)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'end'){
                    this.GameEnd(selectId)
                }

            });
            
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

    // decision事件
    async GameDecision(selected_option_id){
        // 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()
        try {
            let paramIn = {
                "event": {
                  "type": "decision"
                },
                "session": {
                  "session_id": "session_" + GlobalData.id,
                  "player_count": 1,
                  "difficulty": GlobalData.difficulty
                },
                "time": {
                  "hard_limit_seconds": GlobalData.hard_limit_seconds,
                  "elapsed_active_seconds": this.totalTime,
                  "remaining_seconds": GlobalData.hard_limit_seconds - this.totalTime
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
                "payload": {
                    "selected_option_id": selected_option_id
                },
                "context": GlobalData.initParam.context
            }
            const result = await http.post<{code:Number,data:any }>('invoke', paramIn);
            console.log(result)
            // 销毁loading
            this.RequestLoadingNode.destroy()
            // 恢复计时
            this.timerActive = true;
            // 将参数存储到全局中，以便接下来使用
             GlobalData.initParam = result.data;
            console.log(GlobalData.initParam)

            // 展示剧情
            // 获取控制器
            this.plotController = find('Canvas/PlotRoot')!.getComponent(PlotController)!;

            // ========== 数据解析全部在这里 ==========
            const aiState = result.data.ai_state;
            const payload = result.data.payload;

            // 1. 提取标题
            const title = aiState[this.TITLE_FIELD] || '';

            // 2. 提取内容段落
            const contentLines: string[] = [];
            this.CONTENT_FIELDS_DECISION.forEach(field => {
                const content = aiState[field] ?? payload.result[field] ?? payload.scene[field];
                if (content) contentLines.push(content);
            });

            // 3. NPC台词
            const npcLine = payload.scene.npc_line;

            // 4. 提示文字
            const tipText = "选择一个行动选项来推进故事，你的选择将决定接下来的遭遇。";

            // 5. 选项
            const options = payload.options.map((o: any) => ({
                id: o.id,
                text: o.text
            }));

            // ========== 交给展示层 ==========
            this.plotController.setOptionData(tipText, options);
            this.plotController.startPlayPlot(title, contentLines, npcLine, (selectId) => {
                // 选择后，携带ID重新请求
                console.log(selectId);
                console.log('当前已玩：' + this.totalTime)

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'decision'){
                    this.GameDecision(selectId)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'puzzle'){
                    this.GamePuzzle(selectId)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'combat'){
                    this.GameCombat(selectId)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'end'){
                    this.GameEnd(selectId)
                }
            });
            
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
                        this.GameDecision(selected_option_id); // 重新初始化
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

    // puzzle事件
    async GamePuzzle(selected_option_id){
        // 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()
        try {
            let paramIn = {
                "event": {
                  "type": "puzzle"
                },
                "session": {
                  "session_id": "session_" + GlobalData.id,
                  "player_count": 1,
                  "difficulty": GlobalData.difficulty
                },
                "time": {
                  "hard_limit_seconds": GlobalData.hard_limit_seconds,
                  "elapsed_active_seconds": this.totalTime,
                  "remaining_seconds": GlobalData.hard_limit_seconds - this.totalTime
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
                "payload": {
                    "selected_option_id": selected_option_id
                },
                "context": GlobalData.initParam.context
            }
            const result = await http.post<{code:Number,data:any }>('invoke', paramIn);
            console.log(result)
            // 销毁loading
            this.RequestLoadingNode.destroy()
            // 恢复计时
            this.timerActive = true;
            // 将参数存储到全局中，以便接下来使用
            GlobalData.initParam = result.data;
            console.log(GlobalData.initParam)

            // 展示剧情
            // 获取控制器
            this.plotController = find('Canvas/PlotRoot')!.getComponent(PlotController)!;

            // ========== 数据解析全部在这里 ==========
            const aiState = result.data.ai_state;
            const payload = result.data.payload;

            // 1. 提取标题
            const title = aiState[this.TITLE_FIELD] || '';

            // 2. 提取内容段落
            const contentLines: string[] = [];
            this.CONTENT_FIELDS_PUZZLE.forEach(field => {
                const content = aiState[field] ?? payload.puzzle[field] ?? payload.result[field] ?? payload.scene[field];
                if (content) contentLines.push(content);
            });

            // 3. NPC台词
            const npcLine = payload.scene.npc_line;

            // 4. 提示文字
            const tipText = "选择一个行动选项来推进故事，你的选择将决定接下来的遭遇。";

            // 5. 选项
            const options = payload.options.map((o: any) => ({
                id: o.id,
                text: o.text
            }));

            // ========== 交给展示层 ==========
            this.plotController.setOptionData(tipText, options);
            this.plotController.startPlayPlot(title, contentLines, npcLine, (selectId) => {
                // 选择后，携带ID重新请求
                console.log(selectId);
                console.log('当前已玩：' + this.totalTime)

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'decision'){
                    this.GameDecision(selectId)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'puzzle'){
                    this.GamePuzzle(selectId)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'combat'){
                    this.GameCombat(selectId)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'end'){
                    this.GameEnd(selectId)
                }
            });
            
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
                        this.GamePuzzle(selected_option_id); // 重新初始化
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

    // combat事件
    async GameCombat(selected_option_id){
        // 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()

    }

    // end事件
    async GameEnd(selected_option_id){
        // 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()
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

    // ========== 前后台事件处理 ==========
    /**
     * 游戏进入后台（包括息屏、切应用等）
     */
    private onGameHide() {
        console.log('应用进入后台，暂停计时');
        // 恢复计时
        this.timerActive = false;
    }

    /**
     * 游戏回到前台
     */
    private onGameShow() {
        console.log('应用回到前台，恢复计时');
        // 恢复计时
        this.timerActive = true;
    }

}



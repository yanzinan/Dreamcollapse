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
// 输入玩家姓名
import { PlayerNamePopup } from './PlayerNamePopup'

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

    // 剩余时间
    @property(Label)
    RemainingTime:Label = null;

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

    // combat 事件字段配置
    private readonly CONTENT_FIELDS_COMBAT = [
        "memory_summary",
        "player_action",
        "enemy_action",
        "outcome",
        "summary"
    ]

    // end 事件字段配置
    private readonly CONTENT_FIELDS_END = [
        "outcome",
        "scene",
        "closing_line"
    ]

    // 计算游戏活跃时间
    @property
    private totalTime: number = 0; // 当前累计整秒数

    private timerActive: boolean = false; // 是否计时
    private accumulatedTime: number = 0; // 用于累加 deltaTime 的小数部分

    // 剧情节点
    @property(Node)
    plotRoot: Node = null!;

    // 微小说节点
    @property(Node)
    NovelRoot:Node = null!;

    @property(Label)
    title:Label = null;

    @property(Label)
    content:Label = null;

    @property(Button)
    closeBtn:Button = null;

    // 输入玩家姓名
    @property(Prefab)
    playerNamePrefab: Prefab = null!;

    onLoad(){

        // 场景初始化：输入玩家姓名
        const popupNode = instantiate(this.playerNamePrefab);
        this.node.addChild(popupNode);

        const popup = popupNode.getComponent(PlayerNamePopup);
        if (popup) {
            popup.show();
            popup.onSubmitSuccess = (playerName) => {
                console.log('获取到玩家名称：', playerName);
                GlobalData.player_name = playerName

                // 选择游戏难度
                this.createDifficultyPanel()
            };
        }
        
        

        // 初始化计时
        this.totalTime = 0;
        this.accumulatedTime = 0;
        this.timerActive = true;

        this.NovelRoot.active = false;
    }

    start() {
        // 监听 前后台切换 事件
        game.on(Game.EVENT_SHOW, this.onGameShow, this);
        game.on(Game.EVENT_HIDE, this.onGameHide, this);

        this.closeBtn.node.on(Button.EventType.CLICK, this.Logout, this);
    }

    update(deltaTime: number) {
        // console.log('当前游戏时间（秒）：', this.totalTime);
        let remainingTime = GlobalData.hard_limit_seconds - this.totalTime;
        this.RemainingTime.string = '本局剩余时间' + (remainingTime > 0 ? remainingTime : 0) + ' s'

        if (!this.timerActive) return;

        // 累加 deltaTime
        this.accumulatedTime += deltaTime;

        // 当累计时间 >= 1 秒时，增加 totalTime
        while (this.accumulatedTime >= 1) {
            this.totalTime += 1;
            this.accumulatedTime -= 1;

            if (!GlobalData.endEventWork && this.totalTime >= GlobalData.hard_limit_seconds) {
                this.timerActive = false
                console.log('游戏结束逻辑')
                UIManager.instance.showGameEndPopup(
                    '游戏时间到，任务失败，您可以选择将您的游戏过程生成一篇微小说，也可以直接退出游戏再来一局。',
                    // 生成微小说
                    () => {
                        GlobalData.history_events.push({
                            "event_type": "timeout",
                            "scene_summary": "任务时间结束",
                            "selected_option_text": "",
                            "result_summary": "任务时间结束，任务失败，玩家强制下线(死亡)"
                        })
                        this.TimeoutEnd()
                    },
                    // 关闭按钮 → 退回首页
                    () => {
                        // 在这里写返回首页逻辑
                        // 例：
                        director.loadScene("Home");
                        console.log("返回首页");
                    }
                )
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
        if(this.totalTime >= GlobalData.hard_limit_seconds) return;
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
            GlobalData.current_scene_summary = result.data.context.current_scene_summary ?? '';
            GlobalData.available_options = result.data.context.available_options ?? [];
            GlobalData.state_flags = Object.assign(GlobalData.state_flags, result.data.context.state_flags ?? {});
            GlobalData.history_events.push({
                "event_type": result.data.event.type,
                "scene_summary": result.data.payload.opening.scene,
                "selected_option_text": "",
                "result_summary": "你决定深入探索。"
            })
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
            this.plotController.startPlayPlot(title, contentLines, npcLine, (selectId, selectText) => {
                // 选择后，携带ID重新请求
                console.log(selectId,selectText);
                console.log('当前已玩：' + this.totalTime)

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'decision'){
                    this.GameDecision(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'puzzle'){
                    this.GamePuzzle(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'combat'){
                    this.GameCombat(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'end'){
                    this.GameEnd()
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
    async GameDecision(selected_option_id,selectText){
        if(GlobalData.history_events.length >= GlobalData.history_events_num){
            UIManager.instance.showGameEndPopup(
                '玩家在本局游戏中迷路了，任务失败，您可以选择将您的游戏过程生成一篇微小说，也可以直接退出游戏再来一局。',
                // 生成微小说
                () => {
                    this.EnoughEnd()
                },
                // 关闭按钮 → 退回首页
                () => {
                    // 在这里写返回首页逻辑
                    // 例：
                    director.loadScene("Home");
                    console.log("返回首页");
                }
            )

            return false
        }
        if(this.totalTime >= GlobalData.hard_limit_seconds) return;
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
                "context": {
                    "current_scene_summary":GlobalData.current_scene_summary,
                    "available_options":GlobalData.available_options,
                    "state_flags":GlobalData.state_flags
                }
            }
            const result = await http.post<{code:Number,data:any }>('invoke', paramIn);
            console.log(result)
            // 销毁loading
            this.RequestLoadingNode.destroy()
            // 恢复计时
            this.timerActive = true;
            // 将参数存储到全局中，以便接下来使用
             GlobalData.initParam = result.data;
             GlobalData.current_scene_summary = result.data.context.current_scene_summary ?? '';
             GlobalData.available_options = result.data.context.available_options ?? [];
             GlobalData.state_flags = Object.assign(GlobalData.state_flags, result.data.context.state_flags ?? {});
             GlobalData.history_events.push({
                 "event_type": result.data.event.type,
                 "scene_summary": result.data.payload.scene.summary,
                 "selected_option_text": result.data.payload.decision.selected_option_text,
                 "result_summary": result.data.payload.result.outcome
             })

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
            this.plotController.startPlayPlot(title, contentLines, npcLine, (selectId,selectText) => {
                // 选择后，携带ID重新请求
                console.log(selectId,selectText);
                console.log('当前已玩：' + this.totalTime)

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'decision'){
                    this.GameDecision(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'puzzle'){
                    this.GamePuzzle(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'combat'){
                    this.GameCombat(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'end'){
                    this.GameEnd()
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
                        this.GameDecision(selected_option_id,selectText); // 重新初始化
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
    async GamePuzzle(selected_option_id,selectText){
        if(GlobalData.history_events.length >= GlobalData.history_events_num){
            UIManager.instance.showGameEndPopup(
                '玩家在本局游戏中迷路了，任务失败，您可以选择将您的游戏过程生成一篇微小说，也可以直接退出游戏再来一局。',
                // 生成微小说
                () => {
                    this.EnoughEnd()
                },
                // 关闭按钮 → 退回首页
                () => {
                    // 在这里写返回首页逻辑
                    // 例：
                    director.loadScene("Home");
                    console.log("返回首页");
                }
            )

            return false
        }
        if(this.totalTime >= GlobalData.hard_limit_seconds) return;
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
                "context": {
                    "current_scene_summary":GlobalData.current_scene_summary,
                    "available_options":GlobalData.available_options,
                    "state_flags":GlobalData.state_flags
                }
            }
            const result = await http.post<{code:Number,data:any }>('invoke', paramIn);
            console.log(result)
            // 销毁loading
            this.RequestLoadingNode.destroy()
            // 恢复计时
            this.timerActive = true;
            // 将参数存储到全局中，以便接下来使用
            GlobalData.initParam = result.data;
            GlobalData.current_scene_summary = result.data.context.current_scene_summary ?? '';
            GlobalData.available_options = result.data.context.available_options ?? [];
            GlobalData.state_flags = Object.assign(GlobalData.state_flags, result.data.context.state_flags ?? {});
            GlobalData.history_events.push({
                "event_type": result.data.event.type,
                "scene_summary": result.data.payload.scene.summary,
                "selected_option_text": result.data.payload.attempt.selected_option_text,
                "result_summary": result.data.payload.result.consequence
            })

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
                const content = aiState[field] 
                ?? (payload.puzzle && payload.puzzle[field])
                ?? (payload.result && payload.result[field])
                ?? (payload.scene && payload.scene[field]);
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
            this.plotController.startPlayPlot(title, contentLines, npcLine, (selectId,selectText) => {
                // 选择后，携带ID重新请求
                console.log(selectId);
                console.log('当前已玩：' + this.totalTime)

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'decision'){
                    this.GameDecision(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'puzzle'){
                    this.GamePuzzle(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'combat'){
                    this.GameCombat(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'end'){
                    this.GameEnd()
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
                        this.GamePuzzle(selected_option_id,selectText); // 重新初始化
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
    async GameCombat(selected_option_id,selectText){
        if(GlobalData.history_events.length >= GlobalData.history_events_num){
            UIManager.instance.showGameEndPopup(
                '玩家在本局游戏中迷路了，任务失败，您可以选择将您的游戏过程生成一篇微小说，也可以直接退出游戏再来一局。',
                // 生成微小说
                () => {
                    this.EnoughEnd()
                },
                // 关闭按钮 → 退回首页
                () => {
                    // 在这里写返回首页逻辑
                    // 例：
                    director.loadScene("Home");
                    console.log("返回首页");
                }
            )

            return false
        }
        if(this.totalTime >= GlobalData.hard_limit_seconds) return;
        // 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()
        try {
            let paramIn = {
                "event": {
                  "type": "combat"
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
                "context": {
                    "current_scene_summary":GlobalData.current_scene_summary,
                    "available_options":GlobalData.available_options,
                    "state_flags":GlobalData.state_flags
                }
            }
            const result = await http.post<{code:Number,data:any }>('invoke', paramIn);
            console.log(result)
            // 销毁loading
            this.RequestLoadingNode.destroy()
            // 恢复计时
            this.timerActive = true;
            // 将参数存储到全局中，以便接下来使用
            GlobalData.initParam = result.data;
            GlobalData.current_scene_summary = result.data.context.current_scene_summary ?? '';
            GlobalData.available_options = result.data.context.available_options ?? [];
            GlobalData.state_flags = Object.assign(GlobalData.state_flags, result.data.context.state_flags ?? {});
            GlobalData.history_events.push({
                "event_type": result.data.event.type,
                "scene_summary": result.data.payload.scene.summary,
                "selected_option_text": selectText,
                "result_summary": result.data.payload.result.outcome
            })

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
            this.CONTENT_FIELDS_COMBAT.forEach(field => {
                const content = aiState[field] ?? payload.result[field] ?? payload.scene[field];
                if (content) contentLines.push(content);
            });

            // 3. NPC台词
            const npcLine = payload.scene.npc_line ?? 'combat';

            // 4. 提示文字
            const tipText = "选择一个行动选项来推进故事，你的选择将决定接下来的遭遇。";

            // 5. 选项
            const options = payload.options.map((o: any) => ({
                id: o.id,
                text: o.text
            }));

            // ========== 交给展示层 ==========
            this.plotController.setOptionData(tipText, options);
            this.plotController.startPlayPlot(title, contentLines, npcLine, (selectId,selectText) => {
                // 选择后，携带ID重新请求
                console.log(selectId,selectText);
                console.log('当前已玩：' + this.totalTime)

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'decision'){
                    this.GameDecision(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'puzzle'){
                    this.GamePuzzle(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'combat'){
                    this.GameCombat(selectId,selectText)
                }

                // 判断接下来该走哪个事件流程
                if(result.data.routing.next_event_type == 'end'){
                    this.GameEnd()
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
                        this.GameCombat(selected_option_id,selectText); // 重新初始化
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

    // 正常end事件
    async GameEnd(){
        if(this.totalTime >= GlobalData.hard_limit_seconds) return;
        // 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()
        try {
            let paramIn = {
                "event": {
                  "type": "end"
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
                    // "selected_option_id": selected_option_id
                },
                "context": {
                    "current_scene_summary":GlobalData.current_scene_summary,
                    // "available_options":GlobalData.available_options,
                    "state_flags":GlobalData.state_flags,
                    "history_events":GlobalData.history_events
                }
            }
            const result = await http.post<{code:Number,data:any }>('invoke', paramIn);
            GlobalData.novel_summary = result.data.payload.novel_summary
            console.log(result)
            // 销毁loading
            this.RequestLoadingNode.destroy()
            // 将参数存储到全局中，以便接下来使用
            GlobalData.initParam = result.data;
            GlobalData.endEventWork = true;

            // 恢复计时
            this.timerActive = true;

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
            this.CONTENT_FIELDS_END.forEach(field => {
                const content = payload.ending[field] ?? payload.epilogue[field];
                if (content) contentLines.push(content);
            });

            // ========== 交给展示层 ==========
            this.plotController.startPlayPlot(title, contentLines, '', (selectId,selectText) => {
                // 选择后，携带ID重新请求
                if(selectId == 999 && selectText == 'nextNovel'){
                    // 展示生成微小说的弹窗
                    setTimeout(()=>{
                        UIManager.instance.showGameEndPopup(
                            '游戏结束，您可以选择将您的游戏过程生成一篇微小说，也可以直接退出游戏再来一局。',
                            // 生成微小说
                            () => {
                                this.GenerateNovel()
                            },
                            // 关闭按钮 → 退回首页
                            () => {
                                // 在这里写返回首页逻辑
                                // 例：
                                director.loadScene("Home");
                                console.log("返回首页");
                            }
                        )
                    },1000) 
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
                        this.GameEnd(); // 重新初始化
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

    // 游戏超时end
    async TimeoutEnd(){
        // 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()
        try {
            let paramIn = {
                "event": {
                  "type": "end"
                },
                "session": {
                  "session_id": "session_" + GlobalData.id,
                  "player_count": 1,
                  "difficulty": GlobalData.difficulty
                },
                "time": {
                  "hard_limit_seconds": GlobalData.hard_limit_seconds,
                  "elapsed_active_seconds": GlobalData.hard_limit_seconds,
                  "remaining_seconds": GlobalData.hard_limit_seconds - GlobalData.hard_limit_seconds
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
                    // "selected_option_id": selected_option_id
                },
                "context": {
                    "current_scene_summary":GlobalData.current_scene_summary,
                    // "available_options":GlobalData.available_options,
                    "state_flags":GlobalData.state_flags,
                    "history_events":GlobalData.history_events
                }
            }
            const result = await http.post<{code:Number,data:any }>('invoke', paramIn);
            GlobalData.novel_summary = result.data.payload.novel_summary
            console.log(GlobalData.novel_summary)
            // 销毁loading
            this.RequestLoadingNode.destroy()

            // 生成微小说
            this.GenerateNovel()
            
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
                        this.GameEnd(); // 重新初始化
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

    // 已执行事件超过15个 被迫下线
    async EnoughEnd(){
        // 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()

        GlobalData.history_events.push({
            "event_type": "enough",
            "scene_summary": "任务结束",
            "selected_option_text": "",
            "result_summary": "玩家在做任务时迷路了，找不到通关路线，强制下线(死亡)"
        })
        try {
            let paramIn = {
                "event": {
                  "type": "end"
                },
                "session": {
                  "session_id": "session_" + GlobalData.id,
                  "player_count": 1,
                  "difficulty": GlobalData.difficulty
                },
                "time": {
                  "hard_limit_seconds": GlobalData.hard_limit_seconds,
                  "elapsed_active_seconds": GlobalData.hard_limit_seconds,
                  "remaining_seconds": GlobalData.hard_limit_seconds - GlobalData.hard_limit_seconds
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
                    // "selected_option_id": selected_option_id
                },
                "context": {
                    "current_scene_summary":GlobalData.current_scene_summary,
                    // "available_options":GlobalData.available_options,
                    "state_flags":GlobalData.state_flags,
                    "history_events":GlobalData.history_events
                }
            }
            const result = await http.post<{code:Number,data:any }>('invoke', paramIn);
            GlobalData.novel_summary = result.data.payload.novel_summary
            console.log(GlobalData.novel_summary)

            // 销毁loading
            this.RequestLoadingNode.destroy()
            // 生成微小说
            this.GenerateNovel()
            
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
                        this.EnoughEnd(); // 重新初始化
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

    // 生成微小说
    async GenerateNovel(){
        // 暂停计时
        this.timerActive = false;
        // 展示loading
        this.createLoading()
        try {
            let paramIn = {
                "player_name": GlobalData.player_name,
                "novel_summary": GlobalData.novel_summary
            }
            const result = await http.post<{code:Number,data:any }>('novel', paramIn);
            // 销毁loading
            this.RequestLoadingNode.destroy()
            // 将剧情展示页面关掉
            this.plotRoot.active = false

            // 展示微小说
            this.NovelRoot.active = true
            this.title.string = result.data.title;
            this.content.string = result.data.content;
            
        } catch (error: any) {
            console.error('novel失败:', error);
            // ======================
            // 捕获 502 弹出预制体弹窗
            // ======================
            if (error.code === 502) {
                // 销毁loading
                this.RequestLoadingNode.destroy()
                
                UIManager.instance.showNetErrorPopup(
                    // 重试按钮
                    () => {
                        this.GenerateNovel(); // 重新初始化
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

    // 退出游戏
    private Logout(){
        director.loadScene("Home");
    }

}



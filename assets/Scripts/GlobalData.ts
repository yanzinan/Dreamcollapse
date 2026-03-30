// GlobalData.ts
export default class GlobalData {
    // 每一局游戏的id
    public static id:string = '';
    // 游戏难易程度
    public static difficulty:string = '';
    // 游戏总时长
    public static hard_limit_seconds:number = 300;
    // 游戏活跃时长
    public static elapsed_active_seconds:number = 0;
    // 游戏风格倾向
    public static tone_bias:string = '';
    // 游戏主题倾向
    public static theme_bias:string = '';
    // NPC类型
    public static npc_bias:string = '';

    // context入参
    public static current_scene_summary:string = '';
    public static available_options:Array<[]> = [];
    public static state_flags:Object = {};
    public static history_events:Array<{}> = [];


    // 是否已经走过end事件
    public static endEventWork:Boolean = false;

    // novel入参
    public static player_name:string = '';
    public static novel_summary:Object = {};

    // 限制事件执行次数
    public static history_events_num = 14;

    // 静态属性存储场景跳转参数
    // init事件参数
    public static initParam: any = null;


    // 清空参数（避免数据残留）
    public static clearSceneParams() {
        this.initParam = null;
    }

}
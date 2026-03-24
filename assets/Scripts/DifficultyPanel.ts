import { _decorator, Component, Node, Button, Prefab, instantiate, log } from 'cc';
const { ccclass, property } = _decorator;

// 定义难度类型（方便统一管理）
export enum DifficultyType {
    EASY = "EASY",
    NORMAL = "NORMAL",
    HARD = "HARD"
}

@ccclass('DifficultyPanel')
export class DifficultyPanel extends Component {
    // 暴露按钮属性，拖拽绑定
    @property(Button)
    btnEasy: Button = null!;

    @property(Button)
    btnNormal: Button = null!;

    @property(Button)
    btnHard: Button = null!;

    // 回调函数：外部接收难度参数
    public onDifficultySelected: (type: DifficultyType) => void = null!;

    onLoad() {
        // 绑定按钮点击事件
        this.btnEasy.node.on(Button.EventType.CLICK, () => {
            this.selectDifficulty(DifficultyType.EASY);
        }, this);

        this.btnNormal.node.on(Button.EventType.CLICK, () => {
            this.selectDifficulty(DifficultyType.NORMAL);
        }, this);

        this.btnHard.node.on(Button.EventType.CLICK, () => {
            this.selectDifficulty(DifficultyType.HARD);
        }, this);
    }

    /**
     * 选择难度：关闭面板 + 传递参数
     * @param type 难度类型
     */
    private selectDifficulty(type: DifficultyType) {
        log("选中的难度：", type);
        
        // 1. 关闭当前面板
        this.node.destroy();

        // 2. 触发回调，将难度传递给外部
        if (this.onDifficultySelected) {
            this.onDifficultySelected(type);
        }
    }
}
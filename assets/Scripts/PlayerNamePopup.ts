import { _decorator, Component, Node, EditBox, Button, Label, log } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerNamePopup')
export class PlayerNamePopup extends Component {

    @property(EditBox)
    editBox: EditBox = null!;

    @property(Button)
    submitBtn: Button = null!;

    // 提示文本
    @property(Label)
    tipLabel: Label = null!;

    // 回调给外部
    onSubmitSuccess: (name: string) => void = null!;

    onLoad() {
        this.submitBtn.node.on(Node.EventType.TOUCH_END, this.onSubmit, this);
        // 默认隐藏提示
        this.tipLabel.node.active = false;
    }

    onSubmit() {
        const playerName = this.editBox.string.trim();

        // 判空
        if (!playerName) {
            this.showTip('请输入玩家名称');
            return;
        }

        // 隐藏提示、关闭弹窗
        this.hideTip();
        this.node.active = false;
        // 1. 关闭当前面板
        this.node.destroy();

        // 回传名字
        this.onSubmitSuccess?.(playerName);
    }

    // 显示提示
    showTip(msg: string) {
        this.tipLabel.string = msg;
        this.tipLabel.node.active = true;
    }

    // 隐藏提示
    hideTip() {
        this.tipLabel.node.active = false;
    }

    show() {
        this.node.active = true;
    }
}
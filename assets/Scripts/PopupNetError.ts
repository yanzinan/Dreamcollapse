import { _decorator, Component, Node, Button, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopupNetError')
export class PopupNetError extends Component {

    @property(Label)
    msgLabel: Label = null!;

    @property(Button)
    btnRetry: Button = null!;

    @property(Button)
    btnClose: Button = null!;

    private _onRetry: () => void = null!;
    private _onClose: () => void = null!;

    show(msg: string, onRetry: () => void, onClose: () => void) {
        this.msgLabel.string = msg;
        this._onRetry = onRetry;
        this._onClose = onClose;
        // this.node.active = true;
    }

    onLoad() {
        this.btnRetry.node.on(Button.EventType.CLICK, this.onClickRetry, this);
        this.btnClose.node.on(Button.EventType.CLICK, this.onClickClose, this);
    }

    // 重试 + 销毁弹窗
    onClickRetry() {
        this._onRetry?.();
        this.destroyPopup(); // 核心：销毁
    }

    // 关闭 + 销毁弹窗
    onClickClose() {
        this._onClose?.();
        this.destroyPopup(); // 核心：销毁
    }

    // 统一销毁方法
    private destroyPopup() {
        // this.node.active = false;
        this.node.destroy(); // 销毁预制体实例
    }
}
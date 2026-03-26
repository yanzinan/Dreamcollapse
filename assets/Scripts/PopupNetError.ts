import { _decorator, Component, Button, Label } from 'cc';
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
    }

    onLoad() {
        this.btnRetry.node.on(Button.EventType.CLICK, this.onClickRetry, this);
        this.btnClose.node.on(Button.EventType.CLICK, this.onClickClose, this);
    }

    // 重试
    onClickRetry() {
        this._onRetry?.();
        this.destroySelf();
    }

    // 关闭
    onClickClose() {
        this._onClose?.();
        this.destroySelf();
    }

    // 销毁弹窗
    destroySelf() {
        this.node.destroy();
    }
}
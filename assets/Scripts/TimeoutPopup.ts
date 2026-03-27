import { _decorator, Component, Node, Button, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TimeoutPopup')
export class TimeoutPopup extends Component {
    @property(Label)
    msgLabel: Label = null!;

    @property(Button)
    GenerateMicrofiction: Button = null!;

    @property(Button)
    Logout: Button = null!;

    private _onNovel: () => void = null!;
    private _onLogout: () => void = null!;

    show(msg: string, _onNovel: () => void, _onLogout: () => void) {
        this.msgLabel.string = msg;
        this._onNovel = _onNovel;
        this._onLogout = _onLogout;
    }

    onLoad() {
        this.GenerateMicrofiction.node.on(Button.EventType.CLICK, this.onClickNovel, this);
        this.Logout.node.on(Button.EventType.CLICK, this.onClickLogout, this);
    }

    // 重试
    onClickNovel() {
        this._onNovel?.();
        this.destroySelf();
    }

    // 关闭
    onClickLogout() {
        this._onLogout?.();
        this.destroySelf();
    }

    // 销毁弹窗
    destroySelf() {
        this.node.destroy();
    }
}



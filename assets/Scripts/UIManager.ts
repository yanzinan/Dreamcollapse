import { _decorator, Component, Node, instantiate, Prefab, find } from 'cc';
const { ccclass, property } = _decorator;
import { PopupNetError } from './PopupNetError';

@ccclass('UIManager')
export class UIManager extends Component {

    // 【固定写法】单例，确保任何地方都能拿到
    public static get instance(): UIManager {
        if (this._instance == null) {
            const canvas = find('Canvas');
            if (canvas) {
                this._instance = canvas.getComponent(UIManager);
            }
        }
        return this._instance;
    }
    private static _instance: UIManager = null;

    onLoad() {
        // 注册单例
        UIManager._instance = this;
    }

    // 拖入弹窗预制体
    @property(Prefab)
    popupNetErrorPrefab: Prefab = null!;

    // 显示网络错误弹窗
    showNetErrorPopup(onRetry: () => void, onClose: () => void) {
        const popupNode = instantiate(this.popupNetErrorPrefab);
        popupNode.parent = this.node; // 挂到 Canvas
        const popup = popupNode.getComponent(PopupNetError)!;
        popup.show("城门拥堵，请再次尝试，我替你安排个插队。", onRetry, onClose);
    }
}
import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
const { ccclass, property } = _decorator;
import { PopupNetError } from './PopupNetError';

@ccclass('UIManager')
export class UIManager extends Component {

    static instance: UIManager;
    onLoad() { UIManager.instance = this; }

    @property(Prefab)
    popupNetErrorPrefab: Prefab = null!;

    // 每次调用都创建新弹窗，点击后自动销毁
    showNetErrorPopup(onRetry: () => void, onClose: () => void) {
        const popupNode = instantiate(this.popupNetErrorPrefab);
        popupNode.setParent(this.node); // 挂到 Canvas
        const popup = popupNode.getComponent(PopupNetError)!;
        popup.show("城门拥堵，请再次尝试，我替你安排个插队。", onRetry, onClose);
    }
}
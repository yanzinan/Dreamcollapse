import { _decorator, Component, Node, Label, Button, AudioSource, AudioClip, instantiate, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlotController')
export class PlotController extends Component {
    // 统一根节点
    @property(Node)
    plotRoot: Node = null!;

    // 标题（独立展示，无打字机）
    @property(Label)
    plotTitle: Label = null!;

    // 剧情内容
    @property(Label)
    plotContent: Label = null!;

    // 对话框
    @property(Node)
    dialogBox: Node = null!;
    @property(Label)
    dialogText: Label = null!;
    @property(Button)
    nextBtn: Button = null!;

    // 选项面板
    @property(Node)
    optionPanel: Node = null!;
    @property(Label)
    tipText: Label = null!;
    @property(Node)
    optionContent: Node = null!;
    @property(Prefab)
    optionBtnPrefab: Prefab = null!;

    // 音效
    @property(AudioSource)
    audioSource: AudioSource = null!;
    @property(AudioClip)
    typeSound: AudioClip = null!;

    // 回调
    private onOptionSelectedCallback: (id: number, text: string) => void = null!;

    start() {
        this.plotRoot.active = false
        this.dialogBox.active = false;
        this.optionPanel.active = false;
        this.nextBtn.node.on(Button.EventType.CLICK, this.onShowOptions, this);
    }

    /**
     * 外部调用：开始播放剧情
     * @param title 标题（直接显示）
     * @param contentLines 内容段落（打字机）
     * @param npcLine NPC台词
     * @param onOptionSelected 选择回调
     */
    async startPlayPlot(
        title: string,
        contentLines: string[],
        npcLine: string,
        onOptionSelected: (id: number, text: string) => void
    ) {
        this.onOptionSelectedCallback = onOptionSelected;
        // 展示剧情画面
        this.plotRoot.active = true
        // 1. 直接显示标题（无打字机）
        this.plotTitle.string = title;

        // 2. 内容打字机展示
        this.plotContent.string = '';
        for (let i = 0; i < contentLines.length; i++) { 
            if (i > 0) this.plotContent.string += '\n\n';
            await this.typeTextEffect(this.plotContent, contentLines[i],npcLine);
        }

        // 3. 显示对话框
        if(npcLine != "" && npcLine != 'combat'){
            this.dialogBox.active = true;
            this.dialogText.string = npcLine;
        }

        // combat没有npcLine  直接展示选项框
        if(npcLine == 'combat'){
            this.onShowOptions()
        }

        // 这里是end阶段了  直接调用生成微小说弹窗
        if(npcLine == ""){
            // 提示框
            this.onOptionSelectedCallback(999,'nextNovel');
        }
        
        // await this.typeTextEffect(this.dialogText, npcLine);
    }

    /**
     * 设置选项面板数据
     */
    setOptionData(tip: string, options: { id: number, text: string }[]) {
        this.tipText.string = tip;
        this.optionContent.removeAllChildren();

        options.forEach(item => {
            const btn = instantiate(this.optionBtnPrefab);
            btn.active = true;
            btn.parent = this.optionContent;
            const label = btn.getComponentInChildren(Label);
            if (label) label.string = item.text;

            btn.on(Button.EventType.CLICK, () => {
                this.optionPanel.active = false;
                this.onOptionSelectedCallback(item.id, item.text);
            });
        });
    }

    // 打字机效果
    typeTextEffect(label: Label, text: string, npcLine: string): Promise<void> {
        return new Promise(resolve => {
            let idx = 0;
            const interval = setInterval(() => {
                label.string += text[idx];
                this.playTypeSound();
                idx++;
                if (idx >= text.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, 60);
        });
    }

    // 播放音效
    playTypeSound() {
        if (this.audioSource && this.typeSound) {
            this.audioSource.playOneShot(this.typeSound);
        }
    }

    // 点击继续，显示选项
    onShowOptions = () => {
        this.dialogBox.active = false;
        this.optionPanel.active = true;
    }

    // 外部调用：隐藏整个剧情界面
    hideAllPlot() {
        this.plotRoot.active = false;
    }

    // 显示剧情界面
    showAllPlot() {
        this.plotRoot.active = true;
    }
}
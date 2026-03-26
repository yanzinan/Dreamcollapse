import { _decorator, Component, AudioClip, AudioSource, Node, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {

    // 背景音乐
    @property(AudioClip)
    bgmClip: AudioClip = null!;

    private static instance: AudioManager | null = null;
    private audioSource: AudioSource | null = null;

    onLoad() {
        // 单例模式，确保全局唯一
        if (AudioManager.instance) {
            this.destroy(); // 已有实例则销毁自己
            return;
        }
        AudioManager.instance = this;

        // 不随场景切换销毁
        director.addPersistRootNode(this.node);

        // 添加 AudioSource 播放背景音乐
        this.audioSource = this.node.addComponent(AudioSource);
        this.audioSource.clip = this.bgmClip;
        this.audioSource.loop = true;
        this.audioSource.volume = 0.3;
    }

    // 播放背景音乐
    public static playBGM() {
        if (AudioManager.instance && AudioManager.instance.audioSource) {
            AudioManager.instance.audioSource.play();
        }
    }

    // 停止背景音乐
    public static stopBGM() {
        if (AudioManager.instance && AudioManager.instance.audioSource) {
            AudioManager.instance.audioSource.stop();
        }
    }
}
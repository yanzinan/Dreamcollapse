// GlobalData.ts
export default class GlobalData {
    // 静态属性存储场景跳转参数
    public static initParam: any = null;

    // 清空参数（避免数据残留）
    public static clearSceneParams() {
        this.initParam = null;
    }
}
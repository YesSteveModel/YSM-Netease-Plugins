<script>
import {join, join as pathJoin} from "path";
import {mkdirSync} from "fs";
import {behaviorPackGenerator, resourcePackGenerator} from "./directory_generator.js";
import {modConfigGenerator} from "./mod_config_generator.js";
import {resourceJsonGenerator} from "./resource_json_generator.js";
import {oldVersionRead} from "./old_version_read.js";
import {alphaGlowTextureHandle} from "./alpha_glow_texture_handle.js";

export default {
    name: "java_to_netease_transform",
    props: {
        javaToNeteaseTransformDialog: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            javaPackPath: "",
            neteasePackPath: "",
            authorName: "",
            modelName: "",
            alphaGlowTexture: false,
            variables: new Set(),
            isOldVersion: false
        };
    },
    methods: {
        selectJavaPack: function () {
            let packPaths = electron.dialog.showOpenDialogSync(currentwindow, {
                properties: ["openDirectory"],
                title: "打开 Java 版模型文件夹"
            });
            if (packPaths && packPaths[0]) {
                let ysmFilePath = pathJoin(packPaths[0], "ysm.json");
                let infoJson = join(packPaths[0], "info.json");
                let mainJson = join(packPaths[0], "main.json");
                if (fs.existsSync(ysmFilePath)) {
                    // 检测是否有 ysm.json
                    this.javaPackPath = packPaths[0];
                    this.isOldVersion = false;
                } else if (fs.existsSync(infoJson) || fs.existsSync(mainJson)) {
                    // 检测是否有 info.json 或者 main.json
                    this.javaPackPath = packPaths[0];
                    this.isOldVersion = true;
                } else {
                    electron.dialog.showErrorBox("提示", "当前模型包内无 YSM 相关文件\n请检查是否选择错了文件夹！");
                }
            }
        },
        selectNeteasePack: function () {
            let packPaths = electron.dialog.showOpenDialogSync(currentwindow, {
                properties: ["openDirectory"],
                title: "选择导出路径"
            });
            if (packPaths && packPaths[0]) {
                this.neteasePackPath = packPaths[0];
            }
        },
        checkInputArgs: function () {
            if (!this.javaPackPath) {
                electron.dialog.showErrorBox("警告", "请选择 Java 版模型文件夹");
                return false;
            }
            if (!this.neteasePackPath) {
                electron.dialog.showErrorBox("警告", "请选择导出文件夹");
                return false;
            }
            if (!this.authorName) {
                electron.dialog.showErrorBox("警告", "请填写作者名");
                return false;
            }
            if (!this.modelName) {
                electron.dialog.showErrorBox("警告", "请填写模型名");
                return false;
            }
            let nameReg = /^[\w.]+$/;
            if (!nameReg.test(this.authorName)) {
                electron.dialog.showErrorBox("警告", "作者名不符合规范，必须为小写英文字符或下划线");
                return false;
            }
            if (!nameReg.test(this.modelName)) {
                electron.dialog.showErrorBox("警告", "模型名不符合规范，必须为小写英文字符或下划线");
                return false;
            }
            return true;
        },
        getExistAnimations(resourcePackPath) {
            let existAnimations = [];
            let mainAnimationsPath = pathJoin(resourcePackPath, "animations");
            for (let file of fs.readdirSync(mainAnimationsPath)) {
                let animationFile = fs.readFileSync(pathJoin(mainAnimationsPath, file), "utf-8");
                let animations = autoParseJSON(animationFile, false)["animations"];
                if (animations) {
                    existAnimations = existAnimations.concat(Object.keys(animations));
                }
            }
            return existAnimations;
        },
        getYsmJsonInfo() {
            if (this.isOldVersion) {
                return oldVersionRead(this.javaPackPath);
            } else {
                return autoParseJSON(fs.readFileSync(pathJoin(this.javaPackPath, "ysm.json"), "utf-8"), false);
            }
        },
        handleAlphaGlowTexture(resourcePackPath, modelId) {
            let modelFilePath = pathJoin(resourcePackPath, "models", "entity", modelId + ".json");
            let textureFolderPath = pathJoin(resourcePackPath, "textures", "entity", modelId);
            let texturePaths = [];
            fs.readdirSync(textureFolderPath).forEach(file => {
                if (file.endsWith(".png")) {
                    texturePaths.push(pathJoin(textureFolderPath, file));
                }
            });
            alphaGlowTextureHandle(modelFilePath, texturePaths);
        },
        allPackGenerator: function (rootPath, modelId) {
            // 读取 ysm.json 文件，获取信息
            let ysmJson = this.getYsmJsonInfo();
            // 生成根文件夹
            mkdirSync(rootPath, {recursive: true});
            // 行为包生成
            let behaviorPackPath = pathJoin(rootPath, "behavior_pack");
            let scriptsPath = behaviorPackGenerator(behaviorPackPath, modelId);
            // 资源包生成
            let resourcePackPath = pathJoin(rootPath, "resource_pack");
            resourcePackGenerator(resourcePackPath, modelId);
            // 生成资源
            let extraAnimation = resourceJsonGenerator(modelId, ysmJson, resourcePackPath, this.javaPackPath, this.variables);
            // 获取现有动画列表，用于后续脚本动画的自动补全
            let existAnimations = this.getExistAnimations(resourcePackPath);
            // 生成脚本
            modConfigGenerator(pathJoin(scriptsPath, "modConfig.py"), ysmJson, modelId, this.variables, extraAnimation, existAnimations);
            // 处理泛光贴图
            if (this.alphaGlowTexture) {
                this.handleAlphaGlowTexture(resourcePackPath, modelId);
            }
        },
        confirmTransform: function () {
            // 检查输入参数，有问题不进行后续处理
            if (!this.checkInputArgs()) {
                return;
            }
            // 通过输入参数确定模型 ID
            let modelId = `${this.authorName}_${this.modelName}`;
            // 创建根文件夹
            let rootPath = pathJoin(this.neteasePackPath, modelId);
            // 生成所有的文件
            this.allPackGenerator(rootPath, modelId);
            // 提示
            Blockbench.showQuickMessage(`转换完毕！\n在 ${this.neteasePackPath} 生成了导出后的文件`, 3000);
            // 关闭窗口
            this.javaToNeteaseTransformDialog.close();
        },
    }
};
</script>

<template>
    <div>
        <div class="main-button-layout">
            <p class="main-button-title">Java 版模型包路径：{{ javaPackPath }}</p>
            <button @click="selectJavaPack" style="width: 100%">选择 Java 版模型包</button>
        </div>
        <div class="main-button-layout">
            <p class="main-button-title">导出路径：{{ neteasePackPath }}</p>
            <button @click="selectNeteasePack" style="width: 100%">选择导出路径</button>
        </div>
        <div class="main-button-layout">
            <p class="main-button-title">作者名：请用小写英文字符和下划线</p>
            <input class="main-input" v-model="authorName"/>
        </div>
        <div class="main-button-layout">
            <p class="main-button-title">模型名：请用小写英文字符和下划线</p>
            <input class="main-input" v-model="modelName"/>
        </div>
        <div class="main-button-layout" style="display: flex; align-items: center;">
            <div style="width: 80%">
                <p class="main-button-title">是否处理成泛光贴图？</p>
                <p class="main-button-desc">
                    插件将会把所有以 <code>ysmGlow</code> 开头的组所在的材质替换为 0.2 透明度的贴图，用于在游戏内制作泛光效果。<br>
                    但是部分情况下可能会导致模型过于明亮！
                </p>
            </div>
            <input class="checkbox" type="checkbox" v-model="alphaGlowTexture"/>
        </div>
        <div class="main-button-layout">
            <button style="width: 100%" @click="confirmTransform">确认转换</button>
        </div>
    </div>
</template>

<style scoped>
.main-button-layout {
    width: 100%;
    margin: 10px auto;
}

.main-button-title {
    width: 100%;
    margin: 10px auto;
}

.main-button-desc {
    width: 100%;
    margin: 10px auto;
    font-size: small;
    color: gray;
}

.main-input {
    width: 100%;
    background-color: #1c2026;
    border: #000006 solid 1px;
    height: 30px;
}

.checkbox {
    width: 10%;
    margin: 0 auto;
    transform: scale(1.5);
}
</style>
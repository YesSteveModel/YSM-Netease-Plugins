<script>
import {join as pathJoin} from "path";
import {mkdirSync} from "fs";
import {behaviorPackGenerator, resourcePackGenerator} from "./directory_generator.js";
import {modConfigGenerator} from "./mod_config_generator.js";
import {resourceJsonGenerator} from "./resource_json_generator.js";

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
            variables: new Set()
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
                if (fs.existsSync(ysmFilePath)) {
                    // 检测是否有 ysm.json
                    this.javaPackPath = packPaths[0];
                } else {
                    electron.dialog.showErrorBox("提示", "当前模型包内无 ysm.json 文件\n目前插件仅支持转换新版 Java 版 YSM 格式模型");
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
        allPackGenerator: function (rootPath, modelId) {
            // 读取 ysm.json 文件，获取信息
            let ysmJson = autoParseJSON(fs.readFileSync(pathJoin(this.javaPackPath, "ysm.json"), "utf-8"), false);
            // 生成根文件夹
            mkdirSync(rootPath, {recursive: true});
            // 行为包生成
            let behaviorPackPath = pathJoin(rootPath, "behavior_pack");
            let scriptsPath = behaviorPackGenerator(behaviorPackPath, modelId);
            // 资源包生成
            let resourcePackPath = pathJoin(rootPath, "resource_pack");
            resourcePackGenerator(resourcePackPath, modelId);
            // 生成资源
            resourceJsonGenerator(modelId, ysmJson, resourcePackPath, this.javaPackPath, this.variables);
            // 生成脚本
            modConfigGenerator(pathJoin(scriptsPath, "modConfig.py"), ysmJson, modelId, this.variables);
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

.main-input {
    width: 100%;
    background-color: #1c2026;
    border: #000006 solid 1px;
    height: 30px;
}
</style>
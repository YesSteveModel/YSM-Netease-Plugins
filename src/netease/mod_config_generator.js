import configAnimations from "../../assets/resource/config_animations.json";
import configAnimationsControllers from "../../assets/resource/config_animation_controllers.json";
import configAnimate from "../../assets/resource/config_animate.json";
import configPreviewAnimation from "../../assets/resource/config_preview_animation.json";
import {jsToPythonConfig} from "./js_to_python.js";

function getDefaultEntry(entry) {
    if (entry) {
        return entry;
    }
    return "";
}

function authorTransform(srcAuthors) {
    let outputAuthors = [];
    for (let author of srcAuthors) {
        let avatarName = pathToName(author["avatar"], false);
        let newAuthor = {
            "avatar": `textures/ui/${avatarName}`,
            "name": getDefaultEntry(author["name"]),
            "role": getDefaultEntry(author["role"]),
            "comment": getDefaultEntry(author["comment"])
        };
        outputAuthors.push(newAuthor);
    }
    return outputAuthors;
}

function screenSortTransform(files) {
    let screenSort = [];
    let index = 0;
    let defaultTextureName;
    for (let texture of files["player"]["texture"]) {
        // 考虑带 PBR 的解析
        if (typeof texture === "object" && texture["uv"]) {
            texture = texture["uv"];
        }
        // 第一个索引名必须为 default
        if (index === 0) {
            screenSort.push("default");
            defaultTextureName = pathToName(texture, false);
        } else {
            let textureName = pathToName(texture, false);
            screenSort.push(textureName);
        }
        index++;
    }
    return {screenSort, defaultTextureName};
}


function defaultSkinSwitchTransform(skinSwitch, modelId, defaultTextureName, ysmJson) {
    let defaultSkinSwitch = {
        "gui_scale": 1.0,
        "player_scale": 0.8,
        "gui_animation": `animation.${modelId}.gui`,
        "texture": `textures/entity/${modelId}/${defaultTextureName}`,
        "geometry": `geometry.${modelId}`,
        "animations": [],
        "animation_controllers": [],
        "animate": [],
        "render_controllers": [],
        "extra": []
    };
    skinSwitch["default"] = defaultSkinSwitch;

    // 动画列表
    let defaultAnimations = defaultSkinSwitch["animations"];
    for (let animation of configAnimations) {
        let entry = [
            animation[0],
            animation[1].replace("%model_id%", modelId)
        ];
        defaultAnimations.push(entry);
    }

    // 动画控制器列表
    let defaultAnimationController = defaultSkinSwitch["animation_controllers"];
    for (let controller of configAnimationsControllers) {
        defaultAnimationController.push([controller[0], controller[1].replace("%model_id%", modelId)]);
    }

    // animate 列表
    let defaultAnimate = defaultSkinSwitch["animate"];
    for (let animate of configAnimate) {
        defaultAnimate.push([animate[0], animate[1]]);
    }

    // 渲染控制器
    defaultSkinSwitch["render_controllers"] = [["controller.render.player.first_person_ysm", ""]];

    // 轮盘动画
    let defaultExtraAnimation = defaultSkinSwitch["extra"];
    let srcExtraAnimation = ysmJson["properties"]["extra_animation"];
    Object.entries(srcExtraAnimation).map(([key, value]) => {
        defaultExtraAnimation.push([
            value,
            `/playanimation @s ${key} default 0 \\"query.vertical_speed>0.3||query.ground_speed>0.3||q.is_sneaking\\"`,
        ]);
    });
}

function extraSkinSwitchTransform(screenSort, skinSwitch, modelId) {
    if (screenSort.length <= 1) {
        return;
    }
    for (let i = 1; i < screenSort.length; i++) {
        let textureName = screenSort[i];
        skinSwitch[textureName] = {
            "inherit": true,
            "player_scale": 0.8,
            "texture": `textures/entity/${modelId}/${textureName}`,
        };
    }
}

export function modConfigGenerator(filePath, ysmJson, modelId, variables) {
    let metadata = ysmJson["metadata"];
    let files = ysmJson["files"];

    // 填写基本信息
    let configList = {};
    configList["text"] = metadata["name"];
    configList["entityIdentifier"] = `ysm:${modelId}`;
    configList["tips"] = metadata["tips"];
    configList["gui_render_controller"] = `controller.render.ysm_${modelId}_gui`;
    configList["authors"] = authorTransform(metadata["authors"]);

    // 材质信息
    let {screenSort, defaultTextureName} = screenSortTransform(files);
    configList["screen_sort"] = screenSort;

    // 动画渲染信息
    let skinSwitch = {};
    defaultSkinSwitchTransform(skinSwitch, modelId, defaultTextureName, ysmJson);
    extraSkinSwitchTransform(screenSort, skinSwitch, modelId);
    configList["skin_switch"] = skinSwitch;

    // 预览动画
    let previewAnimation = [];
    for (let entry of configPreviewAnimation) {
        previewAnimation.push([entry[0], entry[1].replace("%model_id%", modelId), entry[2]]);
    }
    configList["preview_animation"] = previewAnimation;

    // 变量初始化
    let newVariables = [];
    variables.forEach(v => {
        newVariables.push(v + "=0;");
    });
    let outputVariables = jsToPythonConfig(newVariables).slice(1, -1);
    let outputConfigList = jsToPythonConfig(configList);

    // 写成 Python 脚本
    fs.writeFileSync(filePath,
        "# -*- coding: utf-8 -*-\n"
        + `initialize = [${outputVariables}]\n`
        + `configList = [${outputConfigList}]`
    );
}
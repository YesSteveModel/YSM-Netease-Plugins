import configAnimations from "../../assets/resource/config_animations.json";
import configAnimationsControllers from "../../assets/resource/config_animation_controllers.json";
import configAnimate from "../../assets/resource/config_animate.json";
import configPreviewAnimation from "../../assets/resource/config_preview_animation.json";
import {jsToPythonConfig} from "./js_to_python.js";
import {fixTextureName} from "./chinese_to_base64.js";


function authorTransform(srcAuthors, modelId) {
    if (!srcAuthors) {
        return [{
            "name": "???",
            "role": "",
            "comment": "",
        }];
    }

    let outputAuthors = [];
    for (let author of srcAuthors) {
        let newAuthor = {
            "name": author["name"] ?? "???",
            "role": author["role"] ?? "",
            "comment": author["comment"] ?? ""
        };
        if (author["avatar"]) {
            let avatarName = fixTextureName(pathToName(author["avatar"], false));
            newAuthor["avatar"] = `textures/ui/${modelId}/${avatarName}`;
        }
        outputAuthors.push(newAuthor);
    }
    return outputAuthors;
}

function screenSortTransformWithoutDefaultTexture(screenSort, files) {
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
            defaultTextureName = fixTextureName(pathToName(texture, false));
        } else {
            let textureName = fixTextureName(pathToName(texture, false));
            screenSort.push(textureName);
        }
        index++;
    }
    return defaultTextureName;
}

function screenSortTransformWithDefaultTexture(defaultTextureName, screenSort, files) {
    // 默认材质必须是放在第一个的
    screenSort.push("default");

    // 剩下的依次存入
    for (let texture of files["player"]["texture"]) {
        // 考虑带 PBR 的解析
        if (typeof texture === "object" && texture["uv"]) {
            texture = texture["uv"];
        }
        let textureName = fixTextureName(pathToName(texture, false));
        // 记得排除默认材质
        if (textureName !== defaultTextureName) {
            // TODO: 那万一其他材质也叫 default 呢？
            screenSort.push(textureName);
        }
    }
}

function screenSortTransform(files, ysmJson) {
    let screenSort = [];
    let defaultTextureName;

    // 先尝试获取所有的材质名，因为会有美术写的 default_texture 根本就不存在
    let allTextureNames = [];
    if (ysmJson["files"] && ysmJson["files"]["player"] && ysmJson["files"]["player"]["texture"]) {
        ysmJson["files"]["player"]["texture"].forEach(texture => {
            // 考虑带 PBR 的解析
            if (typeof texture === "object" && texture["uv"]) {
                texture = texture["uv"];
            }
            let textureName = fixTextureName(pathToName(texture, false));
            allTextureNames.push(textureName);
        });
    }

    if (ysmJson["properties"] && ysmJson["properties"]["default_texture"]) {
        // 如果在 ysm.json 定义了默认材质
        let defaultTextureName = fixTextureName(pathToName(ysmJson["properties"]["default_texture"], false));
        // 需要先检测是否存在
        if (allTextureNames.includes(defaultTextureName)) {
            screenSortTransformWithDefaultTexture(defaultTextureName, screenSort, files);
        } else {
            // 不存在，走默认材质路线
            defaultTextureName = screenSortTransformWithoutDefaultTexture(screenSort, files);
        }
        return {screenSort, defaultTextureName};
    } else {
        // 如果没有定义默认材质
        defaultTextureName = screenSortTransformWithoutDefaultTexture(screenSort, files);
        return {screenSort, defaultTextureName};
    }
}


function defaultSkinSwitchTransform(skinSwitch, modelId, defaultTextureName, extraAnimation, existAnimations) {
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
        let transformName = animation[1].replace("%model_id%", modelId);
        if (existAnimations.includes(transformName)) {
            defaultAnimations.push([animation[0], transformName]);
        } else {
            // 左右手改名问题
            if (animation[0] === "use_righthand" || animation[0] === "use_lefthand") {
                defaultAnimations.push([animation[0], `animation.commander.${animation[0]}`]);
            } else {
                defaultAnimations.push([animation[0], animation[1].replace("%model_id%", "commander")]);
            }
        }
    }
    // 把轮盘动画全加上
    Object.values(extraAnimation).forEach(value => {
        let newAnimationName = `animation.${modelId}.${value[1]}`;
        if (existAnimations.includes(newAnimationName)) {
            defaultAnimations.push([value[1], newAnimationName]);
        } else {
            defaultAnimations.push([value[1], `animation.commander.${value[1]}`]);
        }
    });

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
    defaultSkinSwitch["render_controllers"] = [[`controller.render.player.ysm_${modelId}_first_person`, ""]];

    // 轮盘动画
    let defaultExtraAnimation = defaultSkinSwitch["extra"];
    Object.values(extraAnimation).map(value => {
        let displayAnimationName = value[0];
        let newAnimationName = value[1];
        defaultExtraAnimation.push([
            displayAnimationName,
            `/playanimation @s ${newAnimationName} default 0 \\"query.vertical_speed>0.3||query.ground_speed>0.3||q.is_sneaking\\"`,
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

export function modConfigGenerator(filePath, ysmJson, modelId, variables, extraAnimation, existAnimations) {
    let metadata = ysmJson["metadata"];
    let files = ysmJson["files"];

    // 填写基本信息
    let configList = {};
    configList["text"] = metadata["name"] ?? "";
    configList["entityIdentifier"] = `ysm:${modelId}`;
    configList["tips"] = metadata["tips"] ?? "";
    configList["gui_render_controller"] = `controller.render.ysm_${modelId}_gui`;
    configList["preview_parallel"] = `animation.${modelId}.paperdoll`;
    configList["authors"] = authorTransform(metadata["authors"], modelId);

    // 材质信息
    let {screenSort, defaultTextureName} = screenSortTransform(files, ysmJson);
    configList["screen_sort"] = screenSort;

    // 动画渲染信息
    let skinSwitch = {};
    defaultSkinSwitchTransform(skinSwitch, modelId, defaultTextureName, extraAnimation, existAnimations);
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
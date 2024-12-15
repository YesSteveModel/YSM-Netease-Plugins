import {join as pathJoin} from "path";
import allowAnimation from "../../assets/resource/allow_animations.json";
import {catmullRomFrameToLinear, molangReplacer} from "./molang_replacer.js";

/**
 * 生成动画控制器文件，这个动画控制器是给并行动画用的
 */
export function animationControllersGenerator(resourcePackPath, modelId) {
    let filePath = pathJoin(resourcePackPath, "animation_controllers", `${modelId}.animation_controllers.json`);
    let fileJson = {
        "format_version": "1.19.0",
        "animation_controllers": {}
    };
    let preDefaultJson = fileJson["animation_controllers"][`controller.animation.ysm.pre_default_${modelId}`] = {
        "states": {
            "default": {
                "animations": []
            }
        }
    };
    // 生成 0~7 个低并行动画和并行动画
    for (let num = 0; num < 8; num++) {
        preDefaultJson["states"]["default"]["animations"].push(`pre_parallel${num}`);
    }
    for (let num = 0; num < 8; num++) {
        preDefaultJson["states"]["default"]["animations"].push(`parallel${num}`);
    }
    fs.writeFileSync(filePath, compileJSON(fileJson));
}

function fixHeadXRotationPrePost(value, bone, key) {
    if (value["pre"]) {
        let pre = value["pre"];
        if (typeof pre === "number") {
            bone["rotation"][key]["pre"] = 0;
        } else if (typeof pre === "string") {
            bone["rotation"][key]["pre"] = 0;
        } else if (Array.isArray(pre)) {
            pre[0] = 0;
        }
    }
    if (value["post"]) {
        let post = value["post"];
        if (typeof post === "number") {
            bone["rotation"][key]["post"] = 0;
        } else if (typeof post === "string") {
            bone["rotation"][key]["post"] = 0;
        } else if (Array.isArray(post)) {
            post[0] = 0;
        }
    }
}

function fixHeadXRotationList(headRotation, bone) {
    Object.entries(headRotation).map(([key, value]) => {
        if (typeof value === "number") {
            bone["rotation"][key] = 0;
        } else if (typeof value === "string") {
            bone["rotation"][key] = 0;
        } else if (Array.isArray(value)) {
            value[0] = 0;
        } else if (typeof value === "object") {
            fixHeadXRotationPrePost(value, bone, key);
        }
    });
}

function fixHeadXRotation(bone) {
    let headRotation = bone["rotation"];
    if (typeof headRotation === "number") {
        bone["rotation"] = 0;
    } else if (typeof headRotation === "string") {
        bone["rotation"] = 0;
    } else if (Array.isArray(headRotation)) {
        headRotation[0] = 0;
    } else if (typeof headRotation === "object") {
        fixHeadXRotationList(headRotation, bone);
    }
}

function fixSneakArmAnimations(animation, transformAnimations, modelId, animationName) {
    let needCutArmBones = ["LeftArm", "RightArm", "LeftForeArm", "RightForeArm"];
    let armAnimation = {
        "loop": true,
        "bones": {}
    };
    for (let boneName in animation["bones"]) {
        if (!needCutArmBones.includes(boneName)) {
            continue;
        }
        armAnimation["bones"][boneName] = animation["bones"][boneName];
        delete animation["bones"][boneName];
    }
    if (animation["animation_length"]) {
        armAnimation["animation_length"] = animation["animation_length"];
    }
    transformAnimations[`animation.${modelId}.${animationName}_arm`] = armAnimation;
}

function perBoneFix(animation, boneName, variables) {
    let bone = animation["bones"][boneName];
    if (bone["rotation"]) {
        bone["rotation"] = molangReplacer(bone["rotation"], variables);
        // 对头部需要单独处理 x 轴的旋转
        if (boneName === "Head") {
            fixHeadXRotation(bone);
        }
        catmullRomFrameToLinear(bone["rotation"]);
    }
    if (bone["position"]) {
        bone["position"] = molangReplacer(bone["position"], variables);
        catmullRomFrameToLinear(bone["position"]);
    }
    if (bone["scale"]) {
        bone["scale"] = molangReplacer(bone["scale"], variables);
        catmullRomFrameToLinear(bone["scale"]);
    }
}

export function animationTransformGenerator(srcPath, destPath, modelId, variables) {
    let srcAnimationJson = autoParseJSON(fs.readFileSync(srcPath, "utf-8"), false);
    // 修改名字后的动画
    let transformAnimations = {};
    // 强制修改版本，因为 BlockBench 新版本会换成过于新的
    srcAnimationJson["format_version"] = "1.8.0";
    // 开始遍历，并替换 molang，修改动画名，剔除冗余动画
    for (let animationName in srcAnimationJson["animations"]) {
        // 删除冗余动画
        if (!allowAnimation.includes(animationName)) {
            continue;
        }
        // 处理旋转、位移、缩放动画
        let animation = srcAnimationJson["animations"][animationName];
        for (let boneName in animation["bones"]) {
            perBoneFix(animation, boneName, variables);
        }
        transformAnimations[`animation.${modelId}.${animationName}`] = animation;
        // timeline 动画别忘记处理
        animation["timeline"] = molangReplacer(animation["timeline"], variables, true);
        // sneak_arm 动画和 sneaking_arm 动画需要从正常的动画里剪切出来
        if (animationName === "sneak" || animationName === "sneaking") {
            fixSneakArmAnimations(animation, transformAnimations, modelId, animationName);
        }
        // 这几个必须是循环动画
        let mustBeLoopAnimations = ["ride", "ride_pig", "boat", "sleep"];
        if (mustBeLoopAnimations.includes(animationName)) {
            animation["loop"] = true;
        }
    }
    // 动画替换
    srcAnimationJson["animations"] = transformAnimations;
    // 删除多余的 geckolib_format_version 字段
    if (srcAnimationJson["geckolib_format_version"]) {
        delete srcAnimationJson["geckolib_format_version"];
    }
    // 写入文件
    fs.writeFileSync(destPath, compileJSON(srcAnimationJson));
}

export function extraAnimationTransformGenerator(srcPath, destPath, ysmJson, modelId, variables) {
    let extraAnimation = {};

    // 如果 ysm.json 字段定义了额外动画
    if (ysmJson["properties"] && ysmJson["properties"]["extra_animation"]) {
        let rawExtraAnimation = ysmJson["properties"]["extra_animation"];
        let index = 0;
        for (let key in rawExtraAnimation) {
            // 原动画名：[轮盘显示名称 新动画名]
            extraAnimation[key] = [rawExtraAnimation[key], `extra${index}`];
            index++;
        }
    } else {
        for (let index = 0; index < 8; index++) {
            extraAnimation[`extra${index}`] = [`extra${index}`, `extra${index}`];
        }
    }

    let srcAnimationJson = autoParseJSON(fs.readFileSync(srcPath, "utf-8"), false);
    // 修改名字后的动画
    let transformAnimations = {};
    // 强制修改版本，因为 BlockBench 新版本会换成过于新的
    srcAnimationJson["format_version"] = "1.8.0";
    // 开始遍历，并替换 molang，修改动画名，剔除冗余动画
    for (let animationName in srcAnimationJson["animations"]) {
        // 删除冗余动画
        if (!extraAnimation[animationName]) {
            continue;
        }
        // 处理旋转、位移、缩放动画
        let animation = srcAnimationJson["animations"][animationName];
        for (let boneName in animation["bones"]) {
            perBoneFix(animation, boneName, variables);
        }
        // 如果是 extra 动画
        if (extraAnimation[animationName]) {
            let newName = extraAnimation[animationName][1];
            transformAnimations[`animation.${modelId}.${newName}`] = animation;
        } else {
            transformAnimations[`animation.${modelId}.${animationName}`] = animation;
        }
        // timeline 动画别忘记处理
        animation["timeline"] = molangReplacer(animation["timeline"], variables, true);
        // 轮盘动画必须要是覆盖状态
        animation["override_previous_animation"] = true;
    }
    // 动画替换
    srcAnimationJson["animations"] = transformAnimations;
    // 删除多余的 geckolib_format_version 字段
    if (srcAnimationJson["geckolib_format_version"]) {
        delete srcAnimationJson["geckolib_format_version"];
    }
    // 写入文件
    fs.writeFileSync(destPath, compileJSON(srcAnimationJson));
    // 返回变量
    return extraAnimation;
}
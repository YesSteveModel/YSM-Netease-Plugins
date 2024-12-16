import {join as pathJoin} from "path";
import {
    animationControllersGenerator,
    animationTransformGenerator,
    extraAnimationTransformGenerator
} from "./animation_generator.js";
import {entityJsonGenerator, entityModelGenerator, entityRenderGenerator} from "./entity_generator.js";
import {fixTextureName} from "./chinese_to_base64.js";

export function resourceJsonGenerator(modelId, ysmJson, resourcePackPath, javaPackPath, variables) {
    // 动画控制器
    animationControllersGenerator(resourcePackPath, modelId);

    // 动画文件
    let playerFilesJson = ysmJson["files"]["player"];
    let guiAnimationName = ysmJson["properties"]["preview_animation"];
    animationTransformGenerator(
        pathJoin(javaPackPath, playerFilesJson["animation"]["main"]),
        pathJoin(resourcePackPath, "animations", `${modelId}.main.animation.json`),
        modelId, guiAnimationName, variables
    );
    let extraAnimation = extraAnimationTransformGenerator(
        pathJoin(javaPackPath, playerFilesJson["animation"]["extra"]),
        pathJoin(resourcePackPath, "animations", `${modelId}.extra.animation.json`),
        ysmJson, modelId, variables
    );

    // 实体文件
    let entityFilePath = pathJoin(resourcePackPath, "entity", `${modelId}.entity.json`);
    let defaultTexturePath = playerFilesJson["texture"][0];
    if (typeof defaultTexturePath === "object" && defaultTexturePath["uv"]) {
        defaultTexturePath = defaultTexturePath["uv"];
    }
    let defaultTextureName = fixTextureName(pathToName(defaultTexturePath, false));
    entityJsonGenerator(entityFilePath, defaultTextureName, modelId);

    // 模型文件
    let rawModelPath = pathJoin(javaPackPath, playerFilesJson["model"]["main"]);
    let modelFilePath = pathJoin(resourcePackPath, "models", `entity`, `${modelId}.json`);
    entityModelGenerator(rawModelPath, modelFilePath, modelId);

    // 渲染控制器
    let renderFilePath = pathJoin(resourcePackPath, "render_controllers", `ysm_${modelId}_gui.render_controllers.json`);
    entityRenderGenerator(renderFilePath, modelId);

    // 实体材质
    for (let texturePath of playerFilesJson["texture"]) {
        // 考虑带 PBR 的解析
        if (typeof texturePath === "object" && texturePath["uv"]) {
            texturePath = texturePath["uv"];
        }
        let name = fixTextureName(pathToName(texturePath, true));
        let srcTexturePath = pathJoin(javaPackPath, texturePath);
        let destTexturePath = pathJoin(resourcePackPath, "textures", "entity", modelId, name);
        fs.copyFile(srcTexturePath, destTexturePath, error => {
        });
    }

    // 作者头像
    if (ysmJson["metadata"]["authors"]) {
        for (let authors of ysmJson["metadata"]["authors"]) {
            let avatarPath = authors["avatar"];
            if (!avatarPath) {
                continue;
            }
            let name = fixTextureName(pathToName(avatarPath, true));
            let srcAvatarPath = pathJoin(javaPackPath, avatarPath);
            let destAvatarPath = pathJoin(resourcePackPath, "textures", "ui", modelId, name);
            fs.copyFile(srcAvatarPath, destAvatarPath, error => {
            });
        }
    }

    return extraAnimation;
}
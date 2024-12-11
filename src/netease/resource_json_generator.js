import {join as pathJoin} from "path";
import {animationControllersGenerator, animationTransformGenerator} from "./animation_generator.js";
import {entityJsonGenerator, entityModelGenerator, entityRenderGenerator} from "./entity_generator.js";

export function resourceJsonGenerator(modelId, ysmJson, resourcePackPath, javaPackPath, variables) {
    // 动画控制器
    animationControllersGenerator(resourcePackPath, modelId);

    // 动画文件
    let playerFilesJson = ysmJson["files"]["player"];
    animationTransformGenerator(
        pathJoin(javaPackPath, playerFilesJson["animation"]["main"]),
        pathJoin(resourcePackPath, "animations", `${modelId}.main.animation.json`),
        modelId, variables
    );
    animationTransformGenerator(
        pathJoin(javaPackPath, playerFilesJson["animation"]["extra"]),
        pathJoin(resourcePackPath, "animations", `${modelId}.extra.animation.json`),
        modelId, variables
    );

    // 实体文件
    let entityFilePath = pathJoin(resourcePackPath, "entity", `${modelId}.entity.json`);
    let textureName = pathToName(playerFilesJson["texture"][0], false);
    entityJsonGenerator(entityFilePath, textureName, modelId);

    // 模型文件
    let rawModelPath = pathJoin(javaPackPath, playerFilesJson["model"]["main"]);
    let modelFilePath = pathJoin(resourcePackPath, "models", `entity`, `${modelId}.json`);
    entityModelGenerator(rawModelPath, modelFilePath, modelId);

    // 渲染控制器
    let renderFilePath = pathJoin(resourcePackPath, "render_controllers", `ysm_${modelId}_gui.render_controllers.json`);
    entityRenderGenerator(renderFilePath, modelId);

    // 实体材质
    for (let texturePath of playerFilesJson["texture"]) {
        let name = pathToName(texturePath, true);
        let srcTexturePath = pathJoin(javaPackPath, texturePath);
        let destTexturePath = pathJoin(resourcePackPath, "textures", "entity", modelId, name);
        fs.copyFile(srcTexturePath, destTexturePath, error => {
        });
    }

    // 作者头像
    for (let authors of ysmJson["metadata"]["authors"]) {
        let avatarPath = authors["avatar"];
        let name = pathToName(avatarPath, true);
        let srcAvatarPath = pathJoin(javaPackPath, avatarPath);
        let destAvatarPath = pathJoin(resourcePackPath, "textures", "ui", name);
        fs.copyFile(srcAvatarPath, destAvatarPath, error => {
        });
    }
}
import {join as pathJoin} from "path";

export function entityJsonGenerator(entityJsonFilePath, defaultTextureName, modelId) {
    fs.writeFileSync(entityJsonFilePath, compileJSON({
        "format_version": "1.10.0",
        "minecraft:client_entity": {
            "description": {
                "identifier": `ysm:${modelId}`,
                "materials": {
                    "default": "entity_alphatest"
                },
                "textures": {
                    "default": `textures/entity/${modelId}/${defaultTextureName}`
                },
                "geometry": {
                    "default": `geometry.${modelId}`
                },
                "render_controllers": [
                    `controller.render.ysm_${modelId}_gui`
                ],
                "scripts": {
                    "initialize": [
                        "variable.ysm_skin = 0.0;",
                        "variable.ysm_gui = 0.0;",
                        "variable.ysm_show = 0.0;",
                        "variable.ysm_preview = 0.0;",
                        "variable.ysm_light = 0.0;"
                    ]
                }
            }
        }
    }));
}

export function entityModelGenerator(srcModelPath, destModelPath, modelId) {
    let modelJson = autoParseJSON(fs.readFileSync(srcModelPath, "utf-8"), false);
    modelJson["format_version"] = "1.12.0";
    modelJson["minecraft:geometry"][0]["description"]["identifier"] = `geometry.${modelId}`;

    // 模型需要添加 waist 组
    let hasWaistBone = false;
    let upBodyIndex = -1;

    // 模型需要添加 sleepfix 组
    let hasSleepFixBone = false;
    let rootIndex = -1;

    // 给左右手添加定位点
    let bones = modelJson["minecraft:geometry"][0]["bones"];
    for (let i = bones.length - 1; i >= 0; i--) {
        let bone = bones[i];
        if (bone["name"] === "RightHandLocator") {
            let newBone = {
                "name": "rightItem",
                "parent": "RightHandLocator",
                "pivot": bone["pivot"]
            };
            bones.splice(i + 1, 0, newBone);
        } else if (bone["name"] === "LeftHandLocator") {
            let newBone = {
                "name": "leftItem",
                "parent": "LeftHandLocator",
                "pivot": bone["pivot"]
            };
            bones.splice(i + 1, 0, newBone);
        } else if (bone["name"] === "waist") {
            hasWaistBone = true;
            Blockbench.notification(
                "提示：",
                "当前模型已经包含了 waist 组，插件无法再添加 waist 组"
            );
        } else if (bone["name"] === "UpBody") {
            upBodyIndex = i;
        } else if (bone["name"] === "sleepfix") {
            hasSleepFixBone = true;
            Blockbench.notification(
                "提示：",
                "当前模型已经包含了 sleepfix 组，插件无法再添加 sleepfix 组"
            );
        } else if (bone["name"] === "Root") {
            rootIndex = i;
        }
    }

    // 添加  waist 组
    if (!hasWaistBone) {
        if (upBodyIndex < 0) {
            Blockbench.notification(
                "提示：",
                "当前模型缺少 UpBody 组，插件无法添加 waist 组"
            );
        } else if (bones[upBodyIndex]["name"] === "UpBody") {
            let parent = bones[upBodyIndex]["parent"];
            bones[upBodyIndex]["parent"] = "waist";

            let waist = {
                "name": "waist",
                "parent": parent,
                "pivot": bones[upBodyIndex]["pivot"]
            };

            bones.splice(upBodyIndex, 0, waist);
        }
    }

    // 添加 sleepfix 组
    if (!hasSleepFixBone) {
        if (rootIndex < 0) {
            Blockbench.notification(
                "提示：",
                "当前模型缺少 Root 组，插件无法添加 sleepfix 组"
            );
        } else if (bones[rootIndex]["name"] === "Root") {
            let parent = bones[rootIndex]["parent"];
            bones[rootIndex]["parent"] = "sleepfix";

            let sleepFix = {
                "name": "sleepfix",
                "pivot": bones[rootIndex]["pivot"]
            };

            if (parent) {
                sleepFix["parent"] = parent;
            }

            bones.splice(rootIndex, 0, sleepFix);
        }
    }


    fs.writeFileSync(destModelPath, compileJSON(modelJson));
}

function guiRenderGenerator(modelId, renderFilePath) {
    let renderJson = {
        "format_version": "1.8.0",
        "render_controllers": {}
    };
    renderJson["render_controllers"][`controller.render.ysm_${modelId}_gui`] = {
        "arrays": {
            "textures": {
                "Array.skins": ["Texture.default"]
            },
            "materials": {
                "Array.materials": ["Material.default", "Material.tohru"]
            }
        },
        "geometry": "Geometry.default",
        "materials": [{"*": "Array.materials[variable.ysm_light]"}],
        "textures": ["Array.skins[variable.ysm_skin]"]
    };
    fs.writeFileSync(renderFilePath, compileJSON(renderJson));
}

function getRightArmBones(modelFilePath) {
    let modelJson = autoParseJSON(fs.readFileSync(modelFilePath, "utf-8"), false);
    let bones = modelJson["minecraft:geometry"][0]["bones"];
    let rightArmBones = ["RightArm"];
    for (let bone of bones) {
        if (bone["parent"] && rightArmBones.includes(bone["parent"])) {
            rightArmBones.push(bone["name"]);
        }
    }
    return rightArmBones;
}

function firstPersonRenderGenerator(modelId, modelFilePath, renderFilePath, rawArmModelPath) {
    let renderJson = {
        "format_version": "1.8.0",
        "render_controllers": {}
    };
    let firstPersonRender = renderJson["render_controllers"][`controller.render.player.ysm_${modelId}_first_person`] = {
        "geometry": "Geometry.default",
        "materials": [{"*": "Material.default"}],
        "textures": ["Texture.default"],
        "part_visibility": []
    };

    // 读取主模型文件，获取 RightArm 及其子模型
    let mainModelRightArm = getRightArmBones(modelFilePath);
    // 读取 Arm 模型文件，获取 RightArm 及其子模型
    let armModelRightArm = getRightArmBones(rawArmModelPath);
    // 主模型和 arm 模型取交集
    let intersection = mainModelRightArm.filter(v => armModelRightArm.includes(v));

    let partVisibility = firstPersonRender["part_visibility"];
    // 隐藏所有骨骼
    partVisibility.push({"*": false});
    // 仅显示 RightArm 及其子模型
    intersection.forEach(bone => {
        let part = {};
        part[bone] = "q.get_equipped_item_name(0) == ''";
        partVisibility.push(part);
    });

    fs.writeFileSync(renderFilePath, compileJSON(renderJson));
}

export function entityRenderGenerator(resourcePackPath, modelFilePath, modelId, rawArmModelPath) {
    let guiRenderFilePath = pathJoin(resourcePackPath, "render_controllers", `ysm_${modelId}_gui.render_controllers.json`);
    guiRenderGenerator(modelId, guiRenderFilePath);

    let firstPersonRenderFilePath = pathJoin(resourcePackPath, "render_controllers", `ysm_${modelId}_first_person.render_controllers.json`);
    firstPersonRenderGenerator(modelId, modelFilePath, firstPersonRenderFilePath, rawArmModelPath);
}
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
                        "variable.ysm_geo = 0.0;",
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
    fs.writeFileSync(destModelPath, compileJSON(modelJson));
}

export function entityRenderGenerator(renderFilePath, modelId) {
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
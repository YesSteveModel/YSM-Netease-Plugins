import {join} from "path";

export function oldVersionRead(packDirectory) {
    // 1.1.4/1.1.5 版本格式检查
    let packName = pathToName(packDirectory, false);
    let infoJson = join(packDirectory, "info.json");
    let mainJson = join(packDirectory, "main.json");
    let ysmExtraInfo = {};

    if (fs.existsSync(infoJson)) {
        ysmExtraInfo = autoParseJSON(fs.readFileSync(infoJson, {encoding: "utf8"}));
    } else if (fs.existsSync(mainJson)) {
        let mainFileJson = autoParseJSON(fs.readFileSync(mainJson, {encoding: "utf8"}));
        ysmExtraInfo = mainFileJson["minecraft:geometry"][0]["description"]["ysm_extra_info"];
    }
    if (!ysmExtraInfo) {
        ysmExtraInfo = {
            "name": `${packName}`,
            "tips": "",
            "authors": ["???"]
        };
    }

    let ysmJson = {
        "spec": 2,
        "metadata": {
            "name": "",
            "tips": "",
            "authors": []
        },
        "properties": {
            "extra_animation": {},
        },
        "files": {
            "player": {
                "model": {
                    "main": "main.json"
                },
                "animation": {
                    "main": "main.animation.json",
                    "extra": "extra.animation.json"
                },
                "texture": []
            }
        }
    };

    // 给 ysm 填充数据
    let metadata = ysmJson["metadata"];
    let properties = ysmJson["properties"];
    let player = ysmJson["files"]["player"];

    metadata["name"] = ysmExtraInfo["name"] ?? packName;
    metadata["tips"] = ysmExtraInfo["tips"] ?? "";
    if (ysmExtraInfo["authors"]) {
        ysmExtraInfo["authors"].forEach(srcAuthor => metadata["authors"].push({"name": srcAuthor}));
    }

    let extraAnimations = properties["extra_animation"];
    if (ysmExtraInfo["extra_animation_names"]) {
        let index = 0;
        ysmExtraInfo["extra_animation_names"].forEach(name => {
            extraAnimations[`extra${index}`] = name;
            index++;
        });
    } else {
        for (let i = 0; i < 8; i++) {
            extraAnimations[`extra${i}`] = `extra${i}`;
        }
    }

    let texture = player["texture"];
    fs.readdirSync(packDirectory).forEach(file => {
        if (file.endsWith(".png") && file !== "arrow.png") {
            if (file === "default.png") {
                texture.unshift(file);
            } else {
                texture.push(file);
            }
        }
    });

    return ysmJson;
}
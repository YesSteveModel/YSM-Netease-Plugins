import {alphaImage} from "./jimp_image_handle.js";

function handleUVTexture(value, allUVs) {
    let x = value["uv"][0];
    let y = value["uv"][1];
    let w = value["uv_size"][0];
    let h = value["uv_size"][1];

    if (w < 0) {
        x = x + w;
        w = Math.abs(x);
    }
    if (h < 0) {
        y = y + h;
        h = Math.abs(h);
    }

    allUVs.push([x, y, w, h]);
}

function handleBoxTexture(uv, size, allUVs) {
    let u = uv[0];
    let v = uv[1];
    let x = size[0];
    let y = size[1];
    let z = size[2];

    allUVs.push(
        [u + z, v, 2 * x, z],
        [u, v + z, 2 * (x + z), y]
    );
}

function handleCube(cube, allUVs) {
    let size = cube["size"];
    let uv = cube["uv"];
    if (!size || !uv) {
        return;
    }
    if (Array.isArray(uv)) {
        // 盒贴图模式
        handleBoxTexture(uv, size, allUVs);
    } else if (typeof uv === "object") {
        // UV 贴图模式
        Object.values(uv).forEach(value => handleUVTexture(value, allUVs));
    }
}

export function alphaGlowTextureHandle(modelFilePath, texturePaths) {
    let modelJson = autoParseJSON(fs.readFileSync(modelFilePath, "utf-8"));
    let geometry = modelJson["minecraft:geometry"][0];
    let textureWidth = geometry["description"]["texture_width"];
    let textureHeight = geometry["description"]["texture_height"];
    let bones = geometry["bones"];

    // 存储 x y w h
    let tmpAllUVs = [];
    bones.forEach(bone => {
        if (bone["name"].startsWith("ysmGlow") && bone["cubes"]) {
            bone["cubes"].forEach(cube => handleCube(cube, tmpAllUVs));
        }
    });

    // 转换为比例
    let allUVs = [];
    tmpAllUVs.forEach(value => {
        allUVs.push([
            value[0] / textureWidth, value[1] / textureHeight,
            value[2] / textureWidth, value[3] / textureHeight
        ]);
    });

    // 批量处理贴图
    texturePaths.forEach(texturePath => {
        alphaImage(texturePath, allUVs).then(ignore => {
        });
    });
}
import {mkdirSync} from "fs";
import {join as pathJoin} from "path";
import behaviorPackManifest from "../../assets/manifest/behavior_pack.json";
import loaderClientPy from "../../assets/python/QuModLibs/Systems/Loader/Client.py";
import loaderServerPy from "../../assets/python/QuModLibs/Systems/Loader/Server.py";
import loaderSharedResPy from "../../assets/python/QuModLibs/Systems/Loader/SharedRes.py";
import quClientPy from "../../assets/python/QuModLibs/Client.py";
import quINPy from "../../assets/python/QuModLibs/IN.py";
import quInformationPy from "../../assets/python/QuModLibs/Information.py";
import quMathPy from "../../assets/python/QuModLibs/Math.py";
import quQuModPy from "../../assets/python/QuModLibs/QuMod.py";
import quServerPy from "../../assets/python/QuModLibs/Server.py";
import quUtilPy from "../../assets/python/QuModLibs/Util.py";
import rootClientSystemPy from "../../assets/python/ClientSystem.py";
import rootModMainPy from "../../assets/python/modMain.py";
import resourcePackManifest from "../../assets/manifest/resource_pack.json";

/**
 * ├───entities
 * └───${}Scripts
 *     └───QuModLibs
 *         └───Systems
 *             └───Loader
 */
export function behaviorPackGenerator(behaviorPackPath, modelId) {
    // 生成相关文件夹
    mkdirSync(behaviorPackPath, {recursive: true});
    mkdirSync(pathJoin(behaviorPackPath, "entities"), {recursive: true});

    // 将 modelId 修改为小写驼峰式
    let camelModelId = modelId.replace(/_([a-z])/g, (_, text) => text.toUpperCase());
    // 生成脚本文件夹
    let scriptsPath = pathJoin(behaviorPackPath, camelModelId + "Scripts");
    mkdirSync(pathJoin(scriptsPath, "QuModLibs", "Systems", "Loader"), {recursive: true});

    // 生成随机的 pack_manifest.json
    let copyPackManifest = JSON.parse(JSON.stringify(behaviorPackManifest));
    copyPackManifest["modules"][0]["uuid"] = crypto.randomUUID();
    copyPackManifest["header"]["uuid"] = crypto.randomUUID();
    fs.writeFileSync(pathJoin(behaviorPackPath, "pack_manifest.json"), compileJSON(copyPackManifest));

    // 复制 Python3 脚本，Loader 层
    let loaderDir = pathJoin(scriptsPath, "QuModLibs", "Systems", "Loader");
    fs.writeFileSync(pathJoin(loaderDir, "__init__.py"), "");
    fs.writeFileSync(pathJoin(loaderDir, "Client.py"), loaderClientPy);
    fs.writeFileSync(pathJoin(loaderDir, "Server.py"), loaderServerPy);
    fs.writeFileSync(pathJoin(loaderDir, "SharedRes.py"), loaderSharedResPy);

    // Systems 层
    fs.writeFileSync(pathJoin(scriptsPath, "QuModLibs", "Systems", "__init__.py"), "");

    // QuModLibs 层
    let quModLibsDir = pathJoin(scriptsPath, "QuModLibs");
    fs.writeFileSync(pathJoin(quModLibsDir, "__init__.py"), "");
    fs.writeFileSync(pathJoin(quModLibsDir, "Client.py"), quClientPy);
    fs.writeFileSync(pathJoin(quModLibsDir, "IN.py"), quINPy);
    fs.writeFileSync(pathJoin(quModLibsDir, "Information.py"), quInformationPy);
    fs.writeFileSync(pathJoin(quModLibsDir, "Math.py"), quMathPy);
    fs.writeFileSync(pathJoin(quModLibsDir, "QuMod.py"), quQuModPy);
    fs.writeFileSync(pathJoin(quModLibsDir, "Server.py"), quServerPy);
    fs.writeFileSync(pathJoin(quModLibsDir, "Util.py"), quUtilPy);

    // Root 层
    fs.writeFileSync(pathJoin(scriptsPath, "__init__.py"), "");
    fs.writeFileSync(pathJoin(scriptsPath, "ClientSystem.py"), rootClientSystemPy);
    fs.writeFileSync(pathJoin(scriptsPath, "modMain.py"), rootModMainPy);

    return scriptsPath;
}

/**
 * ├───animations
 * ├───animation_controllers
 * ├───entity
 * ├───models
 * │   └───entity
 * ├───render_controllers
 * ├───shaders
 * └───textures
 *     ├───entity
 *     │   └───${}
 *     └───ui
 *
 * resourcePackPath
 */
export function resourcePackGenerator(resourcePackPath, modelId) {
    // 生成相关文件夹
    mkdirSync(resourcePackPath, {recursive: true});
    mkdirSync(pathJoin(resourcePackPath, "animations"), {recursive: true});
    mkdirSync(pathJoin(resourcePackPath, "animation_controllers"), {recursive: true});
    mkdirSync(pathJoin(resourcePackPath, "entity"), {recursive: true});
    mkdirSync(pathJoin(resourcePackPath, "models", "entity"), {recursive: true});
    mkdirSync(pathJoin(resourcePackPath, "render_controllers"), {recursive: true});
    mkdirSync(pathJoin(resourcePackPath, "shaders"), {recursive: true});
    mkdirSync(pathJoin(resourcePackPath, "textures", "entity", modelId), {recursive: true});
    mkdirSync(pathJoin(resourcePackPath, "textures", "ui", modelId), {recursive: true});

    // 生成随机的 pack_manifest.json
    let copyPackManifest = JSON.parse(JSON.stringify(resourcePackManifest));
    copyPackManifest["modules"][0]["uuid"] = crypto.randomUUID();
    copyPackManifest["header"]["uuid"] = crypto.randomUUID();
    fs.writeFileSync(pathJoin(resourcePackPath, "pack_manifest.json"), compileJSON(copyPackManifest));
}
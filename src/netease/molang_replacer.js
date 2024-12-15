import molangReplacerTable from "../../assets/replace/molang.json";

/**
 * 将基岩版动画的一个 bone 动画转换
 */
export function molangReplacer(animation, variables, isTimeline = false) {
    if (Array.isArray(animation)) {
        // 如果该动画为数组
        return animation.map(v => {
            // 很多人会喜欢往 molang 里写中文，带中文的 molang 一律清除
            if (allAllowCheck(v)) {
                return molangReplacer(v, variables, isTimeline);
            } else if (!isTimeline) {
                return 0;
            }
        });
    } else if (typeof animation === "object") {
        // 处理对象
        for (let key in animation) {
            // lerp_mode 字段不需要处理
            if (key !== "lerp_mode") {
                animation[key] = molangReplacer(animation[key], variables, isTimeline);
            }
        }
        return animation;
    } else if (typeof animation === "string") {
        // 替换 molang
        for (let key in molangReplacerTable) {
            animation = animation.replaceAll(key, molangReplacerTable[key]);
        }

        // 咖啡鱼写的脚本导致出现了一些 {data} 错误，需要修正
        animation = animation.replaceAll(/\{data\d}/g, "0");

        // 尝试正则匹配 variable. 开头的变量，这种变量需要在 Python 脚本中初始化
        let variableReg = /(variable\.[\w.]+)/g;
        let variableResult = animation.match(variableReg);
        if (variableResult) {
            variableResult.forEach(v => variables.add(v));
        }

        // 非 timeline，咖啡鱼的脚本会加上分号，先进行剔除
        if (!isTimeline && animation.charAt(animation.length - 1) === ";") {
            animation = animation.substring(0, animation.length - 1);
        }

        // 有些有赋值语句的帧，需要给行尾加上分号
        // 但是又要进行判断，避免误伤三目运算符
        let hasTernaryOperator = /[><!=]=/.test(animation) && animation.includes("?");
        if (!hasTernaryOperator && animation.includes("=") && animation.charAt(animation.length - 1) !== ";") {
            animation = animation + ";";
        }
        return animation;
    }
    return animation;
}

function hasMolangToLinear(allTimeKey, animation) {
    let hasMolang = false;
    for (let time of allTimeKey) {
        let frameData = animation[time];

        // 检查 hasMolang 是否为 true
        if (hasMolang) {
            hasMolang = false;
            // 如果这一帧是平滑，那么就要改成线性
            if (typeof frameData === "object" && frameData["lerp_mode"]) {
                frameData["lerp_mode"] = "linear";
            }
        }

        // 如果这个关键帧有 molang 语句，将 hasMolang 设置为 true
        if (Array.isArray(frameData)) {
            hasMolang = arrayHasMolang(frameData);
        } else if (typeof frameData === "string") {
            hasMolang = true;
        } else if (typeof frameData === "object") {
            if (frameData["pre"] && Array.isArray(frameData["pre"])) {
                hasMolang = arrayHasMolang(frameData["pre"]);
            }
            if (!hasMolang && frameData["post"] && Array.isArray(frameData["post"])) {
                hasMolang = arrayHasMolang(frameData["post"]);
            }
        }
    }
}

function lastFrameToLinear(allTimeKey, animation) {
    let lastFrameTime = allTimeKey[allTimeKey.length - 1];
    let lastFrame = animation[lastFrameTime];
    if (typeof lastFrame === "object" && lastFrame["lerp_mode"]) {
        lastFrame["lerp_mode"] = "linear";
    }
}

/**
 * 两种情况需要把平滑帧改线性
 * - 前一帧是带 molang 的
 * - 当前帧是最后一帧
 */
export function catmullRomFrameToLinear(animation) {
    if (typeof animation === "object") {
        let allTimeKey = Object.keys(animation);
        // 前一帧是带 molang 的，改成线性
        hasMolangToLinear(allTimeKey, animation);
        // 将最后一帧为平滑的，改成线性
        lastFrameToLinear(allTimeKey, animation);
    }
}

function arrayHasMolang(array) {
    for (let i = 0; i < array.length; i++) {
        if (typeof array[i] === "string") {
            return true;
        }
    }
    return false;
}

function allAllowCheck(text) {
    if (typeof text === "string") {
        if (/[\u4E00-\u9FA5]+/g.test(text)) {
            return false;
        }
        if (text === "[;" || text === "];") {
            return false;
        }
        // 目前不支持这个 molang
        if (text.includes("ysm.bone_rot")) {
            return false;
        }
    }
    return true;
}
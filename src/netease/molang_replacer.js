import molangReplacerTable from "../../assets/replace/molang.json";

/**
 * 将基岩版动画的一个 bone 动画转换
 */
export function molangReplacer(animation, variables) {
    if (Array.isArray(animation)) {
        // 如果该动画为数组
        return animation.map(v => molangReplacer(v, variables));
    } else if (typeof animation === "object") {
        // 处理对象
        for (let key in animation) {
            // lerp_mode 字段不需要处理
            if (key !== "lerp_mode") {
                animation[key] = molangReplacer(animation[key], variables);
            }
        }
        return animation;
    } else if (typeof animation === "string") {
        // 替换 molang
        for (let key in molangReplacerTable) {
            animation = animation.replaceAll(key, molangReplacerTable[key]);
        }

        // 尝试正则匹配 variable. 开头的变量，这种变量需要在 Python 脚本中初始化
        let variableReg = /(variable\.[\w.]+)/g;
        let variableResult = animation.match(variableReg);
        if (variableResult) {
            variableResult.forEach(v => variables.add(v));
        }

        // 给行尾加上分号
        if (animation.charAt(animation.length - 1) !== ";") {
            animation = animation + ";";
        }
        return animation;
    }
    return animation;
}
/**
 * 将 JS 对象转换为 Python 对象
 */
export function jsToPythonConfig(obj, forceTuple = false) {
    if (Array.isArray(obj)) {
        // 如果需要强制生成元组
        if (forceTuple) {
            return `(${obj.map(v => jsToPythonConfig(v, forceTuple)).join(", ")}${obj.length === 1 ? "," : ""})`;
        }
        // 默认生成列表
        return `[${obj.map(jsToPythonConfig).join(", ")}]`;
    } else if (typeof obj === "boolean") {
        // 处理布尔值
        return obj ? "True" : "False";
    } else if (typeof obj === "number") {
        // 处理数字
        return obj.toString();
    } else if (typeof obj === "string") {
        // 处理字符串，替换一些转义字符
        obj = obj.replaceAll("\n", "");
        return `"${obj}"`;
    } else if (typeof obj === "object") {
        // 处理对象
        const entries = Object.entries(obj).map(([key, value]) => {
            // 这些是需要生成为元组的类型
            if (key === "animations" || key === "animation_controllers"
                || key === "animate" || key === "render_controllers"
                || key === "extra" || key === "preview_animation") {
                return `"${key}": [${jsToPythonConfig(value, true).slice(1, -1)}]`;
            }
            return `"${key}": ${jsToPythonConfig(value)}`;
        });
        return `{${entries.join(", ")}}`;
    }
}
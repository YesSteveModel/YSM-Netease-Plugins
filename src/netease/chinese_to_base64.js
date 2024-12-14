/**
 * - 检查是否包含中文，如果包含，那么将其改成 base64 编码
 * - 将大写英文字符换成小写的
 * - 将空格替换成下划线
 * - 将 - 也替换成下划线
 */
export function fixTextureName(name) {
    // 将大写字母替换成小写字母，并将空格和连字符替换为下划线
    name = name.toLowerCase().replace(/[\s-]+/g, "_");
    if (/[\u4E00-\u9FA5]+/g.test(name)) {
        // 检查是否带后缀
        let hasExtension = false;
        if (name.endsWith(".png")) {
            hasExtension = true;
            name = name.substring(0, name.length - 4);
        }
        // 使用 TextEncoder 将中文字符串转换为 UTF-8 编码的字节
        const bytes = new TextEncoder().encode(name);
        // 使用 btoa 将字节数组转为 Base64
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        if (hasExtension) {
            return btoa(binary).toLowerCase()
                    .replaceAll("+", "_")
                    .replaceAll("/", "_")
                    .replaceAll("=", "")
                + ".png";
        } else {
            return btoa(binary).toLowerCase()
                .replaceAll("+", "_")
                .replaceAll("/", "_")
                .replaceAll("=", "");
        }
    } else {
        return name;
    }
}
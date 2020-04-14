/**
 * Date 支持时间格式化
 */
function Format(format) {
    format = format || "yyyy-MM-dd hh:mm:ss";
    var list = {
        "y+": String(this.getFullYear()), //年
        "M+": String(this.getMonth() + 1), //月份 
        "d+": String(this.getDate()), //日 
        "h+": String(this.getHours()), //小时 
        "m+": String(this.getMinutes()), //分 
        "s+": String(this.getSeconds()), //秒 
        "q+": String(Math.floor((this.getMonth() + 3) / 3)), //季度 
        "S": String(this.getMilliseconds()) //毫秒 

    };
    Object.keys(list).map(function (key) {
        var reg = new RegExp("(" + key + ")", 'g');
        format = format.replace(reg, function (fmt) {
            if (/y+/.test(fmt)) return list[key].substr(4 - fmt.length);
            return fmt.length == 1 ? list[key] : ("00" + list[key]).substr(list[key].length);
        });
    })
    return format;
};

/**
 * 
 * object 支持assign
 */
function assign(target, varArgs) { // .length of function is 2
    if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
            for (var nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
}


let polyInit = () => {
    Date.prototype.Format = Format;
    Object.assign = typeof Object.assign == 'function' ? Object.assign : assign;
}

export {polyInit}
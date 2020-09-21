const parseTpl = require('../../parse/parse');
const fs = require('fs-extra');
const path = require('path');

const customComponent = {};

module.exports = function (fileInfo) {
    return scopeStyle(fileInfo);
};

/**
 * 
 * @param {*} fileInfo - 对应的 wxml 文件信息
 */
function scopeStyle (fileInfo) {
    let dirname = fileInfo.dirname.split(path.sep).pop();
    let basename = fileInfo.basename;
    let classPrefix = '';
    let componentName = dirname + '-' + basename;

    function setClassName (componentName) {
        let bool = customComponent[componentName];
        if (!bool) {
            classPrefix = componentName;
        } else {
            let str = String(Number(new Date()));
            str = '-' + str.substr(0, 2);
            componentName += setClassName(componentName + str);
        }

        return componentName;
    }

    classPrefix = setClassName(componentName);
    
    let _ast = parseTpl.parseString(`
    <view class='${classPrefix} {{className}}' style='{{style}}'></view>
    `);
    // const prop = {
    //     class: {
    //         type: 'unknown',
    //         value: ['']
    //     }
    // };
    /**
     * isComponent
     */
    if (isComponent(fileInfo)) {
        let tplPath = fileInfo.dirname + '/' + fileInfo.basename + '.wxml';

        let ast = parseTpl.parseFile(tplPath);

        let bool = true;
        ast.forEach(function (node) {
            if (node && node.props && node.props['unscope-style']) {
                bool = false;
                delete node.props['unscope-style'];
            }

            if (node && node.props && node.props['is-inline'] !== undefined) {
                _ast = parseTpl.parseString(`
        <view class='${classPrefix} {{className}}' style="display: inline-block;{{style}}"></view>
        `);
            }
        });

        if (!bool) return false;
        // _ast[0].props.class.value.push("{{className}}");
        _ast[0].children = [ast];
        // let originClass = prop.class;
        // ast.forEach(function (node) {
        //     /**
        //      * 忽略非容器标签
        //      */
        //     let tagObj = {
        //         wxs: true,
        //         include: true
        //     };

        //     if (tagObj[ast.type]) return false;
        //     node.props = node.props || {};
        //     node.props.class = node.props.class || prop.class;
        //     originClass = JSON.parse(JSON.stringify(node.props.class));

        //     node.props.class.value[0] = node.props.class.value[0].split(/\s+/)
        //         .map((classname) =>{
        //             return classname + '-' + classPrefix;
        //         });
        //     node.props.class.value[0] = node.props.class.value[0].join(' ');

        //     node.props.class.value[0] = node.props.class.value[0] + ' ' + classPrefix;
        // });

        fileInfo.ast = _ast;
        // originClass.classPrefix = classPrefix;
        return {
            classPrefix
        };
    }
    return false;
}


function isComponent (fileInfo) {
    let jsonPath = fileInfo.dirname + '/' + fileInfo.basename + '.json';

    if (!fs.pathExistsSync(jsonPath)) return false;
    let jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return jsonContent.component;
}
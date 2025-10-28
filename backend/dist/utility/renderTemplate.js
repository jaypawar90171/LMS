"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = renderTemplate;
function renderTemplate(template, data) {
    return template.replace(/{{(.*?)}}/g, (_, key) => {
        return data[key.trim()] ?? "";
    });
}

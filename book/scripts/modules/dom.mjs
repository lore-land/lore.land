export function el(tagName, attributes = {}, ...children) {
    const element = document.createElement(tagName);

    for (const [key, value] of Object.entries(attributes)) {
        if (value === undefined || value === null) continue;

        if (key === 'className') {
            if (value) element.className = value;
        } else if (key === 'dataset') {
            for (const [dKey, dValue] of Object.entries(value)) {
                if (dValue !== undefined && dValue !== null) {
                    element.dataset[dKey] = String(dValue);
                }
            }
        } else if (['textContent', 'innerHTML', 'id', 'value', 'checked', 'src', 'href', 'alt', 'type', 'name', 'tabIndex', 'hidden', 'disabled'].includes(key)) {
            element[key] = value;
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, String(value));
        }
    }

    for (const child of children) {
        if (child !== null && child !== undefined && child !== false) {
            element.append(child);
        }
    }

    return element;
}

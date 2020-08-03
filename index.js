/*** List of all events */
const EVENTS = ["click", "contextmenu", "dblclick", "wheel", "mousemove", "mousedown", "mouseup", "grab", "drop", "mouseleave", "mouseenter"];
/*** List of all cursors */
const CURSORS = ["auto", "default", "none", "context-menu", "help", "pointer", "progress", "wait", "cell", "crosshair", "text", "vertical-text", "alias", "copy", "move", "no-drop", "not-allowed", "e-resize", "n-resize", "ne-resize", "nw-resize", "s-resize", "se-resize", "sw-resize", "w-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "col-resize", "row-resize", "all-scroll", "zoom-in", "zoom-out", "grab", "grabbing"];
const DEFAULT_OPTIONS = {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "black",
    // borderEndsStyle: "square",
    color: "black",
    fontSize: 12,
    fontFamily: "Arial",
    // textAlign: "left",
    textStrokeWidth: 0,
    textStrokeColor: "black",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: "black",
};
/** Trigger events  */
class EventsTrigger {
    /**
     * @constructor
     */
    constructor() {
        /**
         * Array containing events.
         * @type {Map<string, Function[]>}
         */
        this.events = new Map();
    }
    /**
     * Trigger the specified event.
     * @public
     * @param {string} eventName Event name
     * @param {any} e Data to send
     */
    emit(eventName, e) {
        var _a;
        if (this.events.has(eventName)) {
            (_a = this.events.get(eventName)) === null || _a === void 0 ? void 0 : _a.forEach((callback) => {
                callback(e);
            });
        }
        else {
            this.events.set(eventName, []);
        }
        return;
    }
    /**
     * Add event listener.
     * @public
     * @param {string} eventName Event name
     * @param {Function} callback Callback that will be executed when the event is triggered
     */
    on(eventName, callback) {
        var _a;
        if (this.events.has(eventName)) {
            (_a = this.events.get(eventName)) === null || _a === void 0 ? void 0 : _a.push(callback);
        }
        else {
            this.events.set(eventName, [callback]);
        }
        return;
    }
    /**
     * Remove the specified function linked to the specified event.
     * @public
     * @param {string} eventName Event name
     * @param {Function} func Function to delete
     */
    off(eventName, func) {
        if (this.events.has(eventName))
            remove(this.events.get(eventName) || [], func);
        return;
    }
}
/**
 * Represents the area.
 * @extends EventsTrigger
 * @example
 * const can = new CanvAnim(element, options)
 */
class CanvAnim extends EventsTrigger {
    /**
     * @constructor
     * @param {HTMLCanvasElement} element HTML Element
     * @param {ItemOptions} [options] Options
     */
    constructor(element, options) {
        super();
        /**
         * HTML element.
         * @public
         * @type {HTMLCanvasElement}
         */
        this.element = element;
        /**
         * Context of the canvas.
         * @public
         * @type {CanvasRenderingContext2D|null}
         */
        this.ctx = element.getContext("2d");
        /**
         * List of all items.
         * @private
         * @type {Item[]}
         *          */
        this.items = [];
        /**
         * Canvas options.
         * @public
         * @type {ItemOptions}
         */
        this.options = options || {};
        if (typeof this.options.scrollRegion === "undefined") {
            this.options.scrollRegion = [0, 0, 0, 0];
        }
        if (options.width && options.height) {
            element.width = options.width;
            element.height = options.height;
            this.width = options.width;
            this.height = options.height;
        }
        else {
            this.width = element.width;
            this.height = element.height;
        }
        /**
         * Offset X of the canvas.
         * @public
         * @type {number}
         */
        this.x1 = 0;
        /**
         * Offset Y of the canvas view.
         * @public
         * @type {number}
         */
        this.y1 = 0;
        /**
         * Offset X of the lower right corner of the canvas view.
         * @public
         * @type {number}
         */
        this.x2 = this.width;
        /**
         * Offset Y of the lower right corner of the canvas view.
         * @public
         * @type {number}
         */
        this.y2 = this.height;
        this.coordsView(0, 0); // -> draw
        // Init events
        /**
         * Array containing events.
         * @type {Map<string, function[]>}
         */
        this.events = new Map();
        EVENTS.forEach(eventName => {
            if (eventName != "grab" && eventName != "drop") {
                this.element.addEventListener(eventName, e => {
                    e.preventDefault();
                    this.emit(eventName, this.toItemEvent(e, eventName));
                });
            }
        });
        this.element.addEventListener("mousedown", (e) => {
            let element = e.target;
            let emitGrab = (e) => {
                e.preventDefault();
                this.emit("grab", this.toItemEvent(e, "grab"));
                element.addEventListener("mouseup", emitDrop);
                element.addEventListener("mouseleave", emitDrop);
            };
            let emitDrop = (e) => {
                e.preventDefault();
                this.emit("drop", this.toItemEvent(e, "drop"));
                element.removeEventListener("mouseup", emitDrop);
                element.removeEventListener("mousemove", emitGrab);
                element.removeEventListener("mouseleave", emitDrop);
            };
            element.addEventListener("mousemove", emitGrab);
        });
    }
    /**
     * Convert an event to to an item event.
     * @protected
     * @param {MouseEvent} e MouseEvent
     * @param {string} type Event type/name
     * @returns {CanvasEvent}
     */
    toItemEvent(e, type) {
        let x = -this.x1 + e.x - this.element.offsetLeft;
        let y = -this.y1 + e.y - this.element.offsetTop;
        return {
            type: type || e.type,
            x: x,
            y: y,
            canvasX: x + this.x1,
            canvasY: y + this.y1,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            delta: typeof e.deltaY !== "undefined" ? (e.deltaY > 0 ? "up" : "down") : null,
            target: this.findTargeted(x, y)
        };
    }
    /**
     * Create a line in the canvas.
     * @public
     * @param {number} x1 Starting point abscissa
     * @param {number} y1 Starting point ordinate
     * @param {number} x2 End point abscissa
     * @param {number} y2 End point ordinate
     * @param {ItemOptions} [options] Options
     * @returns {Item}
     */
    createLine(x1, y1, x2, y2, options) {
        let item = new LineItem(this, x1, y1, x2, y2, options);
        item.index = this.items.push(item) - 1;
        item.draw();
        return item;
    }
    /**
     * Create a Bezier curve.
     * @public
     * @param {number} x1 Starting point abscissa
     * @param {number} y1 Starting point ordinate
     * @param {number} x2 End point abscissa
     * @param {number} y2 End point ordinate
     * @param {number} cp1x Abscissa of the first point of control
     * @param {number} cp1y Order of the first point of control
     * @param {number} cp2x Abscissa of the second point of control
     * @param {number} cp2y Order of the second point of control
     * @param {ItemOptions} [options] Options
     * @returns {Item}
     */
    createCurve(x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y, options) {
        let item = new CurveItem(this, x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y, options);
        item.index = this.items.push(item) - 1;
        item.draw();
        return item;
    }
    /**
     * Create a rectangle in the canvas.
     * @public
     * @param {number} x Abscissa of the upper left corner
     * @param {number} y Ordinate of the upper left corner
     * @param {number} width Width
     * @param {number} height Height
     * @param {ItemOptions} [options] Options
     * @returns {Item}
     */
    createRectangle(x, y, width, height, options) {
        let item = new RectangleItem(this, x, y, width, height, options);
        item.index = this.items.push(item) - 1;
        item.draw();
        return item;
    }
    /**
     * Create an ellipse in the canvas.
     * @public
     * @param {number} x Center abscissa
     * @param {number} y Center ordonate
     * @param {number} rx Radius X
     * @param {number} ry Radius Y
     * @param {ItemOptions} [options] Options
     * @returns {Item}
     */
    createEllipse(x1, y1, x2, y2, options) {
        let item = new EllipseItem(this, x1, y1, x2, y2, options);
        item.index = this.items.push(item) - 1;
        item.draw();
        return item;
    }
    /**
     * Create an arc in the canvas.
     * @public
     * @param {number} x Center abscissa
     * @param {number} y Center ordinate
     * @param {number} r Radius
     * @param {number} start Value of the angle with which the arc begins
     * @param {number} extent Value of the angle with which the arc ends
     * @param {number} [anticlockwise=true] Anticlockwise
     * @param {ItemOptions} [options] Options
     * @returns {Item}
     */
    createArc(x, y, r, start, extent, anticlockwise, options) {
        let item = new ArcItem(this, x, y, r, start, extent, anticlockwise, options);
        item.index = this.items.push(item) - 1;
        item.draw();
        return item;
    }
    /**
     * Create an image in the canvas.
     * @public
     * @param {number} x Abscissa of the upper left corner
     * @param {number} y Ordinate of the upper left corner
     * @param {number} width Width
     * @param {number} height Height
     * @param {string} url URL
     * @param {ItemOptions} [options] Options
     * @returns {Item}
     */
    createImage(x, y, width, height, url, options) {
        let item = new ImageItem(this, x, y, width, height, url, options);
        item.index = this.items.push(item) - 1;
        item.onload = (ev) => {
            item.draw();
        };
        return item;
    }
    /**
     * Create a text in the canvas.
     * @public
     * @param {string} text Text to show
     * @param {number} x Abscissa of the upper left corner
     * @param {number} y Ordinate of the upper left corner
     * @param {ItemOptions} [options] Options
     * @returns {Item}
     */
    createText(text, x, y, options) {
        let item = new TextItem(this, text, x, y, options);
        item.index = this.items.push(item) - 1;
        item.draw();
        return item;
    }
    /**
     * Add event listener to the selected items.
     * @public
     * @param {(string|string[]|Item|Item[])} selector Items
     * @param {string} eventName Event name
     * @param {Function} callback Callback that will be executed when the event is triggered
     */
    addItemEvent(selector, eventName, callback) {
        this.getItemsWith(selector).forEach((item) => {
            if (item.bbox != null)
                item.bbox.on(eventName, callback);
        });
        return;
    }
    /**
     * Remove event listener to the selected items.
     * @public
     * @param {(string|string[]|Item|Item[])} selector Items
     * @param {string} eventName Event name
     * @param {Function} func Function to delete
     */
    removeItemEvent(selector, eventName, func) {
        this.getItemsWith(selector).forEach((item) => {
            if (item.bbox != null)
                item.bbox.off(eventName, func);
        });
        return;
    }
    /**
     * Change the options of the selected items.
     * @param {string|Item|string[]|Item[]} selector Items
     * @param {ItemOptions} options Options
     */
    itemConfigure(selector, options) {
        this.getItemsWith(selector).forEach((item) => {
            item.configure(options);
        });
        return;
    }
    /**
     * Change the coordonates of the selected items.
     * @public
     * @param {string|Item|string[]|Item[]} selector Items
     * @param {number} x New abscissa
     * @param {number} y New ordinate
     */
    coords(selector, x, y) {
        this.getItemsWith(selector).forEach((item) => {
            item.coords(x, y, undefined, undefined, false);
        });
        this.reload();
        return;
    }
    /**
     * Move the selected items.
     * @public
     * @param {string|Item|string[]|Item[]} selector Items
     * @param {number} dx Abscissa to increment
     * @param {number} dy Ordinate to increment
     */
    move(selector, dx, dy) {
        this.getItemsWith(selector).forEach((item) => {
            item.move(dx, dy, false);
        });
        this.reload();
        return;
    }
    /**
     * Remove selected items.
     * @public
     * @param {string|Item|string[]|Item[]} selector Items to remove
     */
    delete(selector) {
        this.getItemsWith(selector).forEach((item) => {
            item.delete(false);
        });
        this.reload();
        return;
    }
    /**
     * Overlap the selected items in the canvas.
     * @public
     * @param {string|Item|string[]|Item[]} selector Items to overlap
     */
    overlap(selector) {
        this.getItemsWith(selector).forEach((item) => {
            item.overlap(false);
        });
        this.reload();
        return;
    }
    /**
     * Change the cursor in the canvas.
     * @public
     * @param {string} cursor Name or url
     */
    setCursor(cursor) {
        this.element.style.cursor = includes(CURSORS, cursor) ? cursor : "url(" + cursor + ")";
        return;
    }
    /**
     * Change the cursor when hovering over the selected item.
     * @public
     * @param {string|Item|string[]|Item[]} selector Items
     * @param {string} cursor Name or URL
     */
    setItemCursor(selector, cursor) {
        this.getItemsWith(selector).forEach((item) => {
            if (item.bbox != null)
                item.bbox.setCursor(cursor);
        });
        return;
    }
    /**
     * Returns the items associated with the specified selector.
     * @public
     * @param {string|Item|string[]|Item[]} selector Items
     * @returns {Item[]}
     */
    getItemsWith(selector) {
        let rawItems = [];
        let items = [];
        if (selector instanceof Array) {
            selector.forEach((item) => {
                rawItems = rawItems.concat(this.getItemsWith(item));
            });
        }
        else if (selector instanceof Item) {
            let item = selector;
            rawItems.push(item);
        }
        else if (selector === "*") {
            rawItems = this.findAll();
        }
        else if (typeof selector === "string") {
            if (this.tagExists(selector)) {
                rawItems = rawItems.concat(this.findWithTag(selector));
            }
        }
        // unique function
        let map = new Map();
        rawItems.forEach((item) => {
            map.set(item, 0);
        });
        map.forEach((element, key) => {
            items.push(key);
        });
        return items;
    }
    /**
     * Add the specified tag to each specified item.
     * @public
     * @param {(string|string[]|Item|Item[])} selector Selector
     * @param {string} tagName Tag name
     */
    addTag(selector, tagName) {
        if (tagName != "*") {
            this.getItemsWith(selector).forEach(item => {
                if (!item.hasTag(tagName)) {
                    item.tags.push(tagName);
                }
            });
        }
        return;
    }
    /**
     * Add the specified tag to each item in the canvas.
     * @public
     * @param {string} tagName Tag name
     */
    addTagAll(tagName) {
        this.addTag(this.findAll(), tagName);
        return;
    }
    /**
     * Check if the specified tag exists.
     * @public
     * @param {string} tagName Tag name
     * @returns {boolean}
     */
    tagExists(tagName) {
        return Boolean(this.findWithTag(tagName).length);
    }
    /**
     * Check if all the specified items have the specified tag.
     * @public
     * @param {string|Item|string[]|Item[]} selector Selector
     * @param {string} tagName Tag name
     * @returns {boolean}
     */
    hasTag(selector, tagName) {
        return this.getItemsWith(selector).every(item => {
            return item.hasTag(tagName);
        });
    }
    /**
     * Delete the specified tag for each selected items.
     * @public
     * @param {string|Item|string[]|Item[]} selector Selector
     * @param {string|string[]} tagName Tag to delete
     * @returns {Item[]}
     */
    deleteTag(selector, tagName) {
        let items = this.getItemsWith(selector);
        items.forEach((item) => {
            if (item.hasTag(tagName)) {
                item.deleteTag(tagName);
            }
        });
        return items;
    }
    /**
     * Return each item in the canvas.
     * @public
     * @returns {Item[]}
     */
    findAll() {
        return this.items;
    }
    /**
     * Return each items with the specified tag.
     * @public
     * @param {string} tagName Tag name
     * @returns {Item[]}
     */
    findWithTag(tagName) {
        let out = [];
        this.items.forEach(item => {
            if (includes(item.tags, tagName)) {
                out.push(item);
            }
        });
        return out;
    }
    /**
     * Returns each items that are entirely included in the specified rectangle.
     * @public
     * @param {number} x1 Abscissa of the upper left corner
     * @param {number} y1 Ordinate of the upper left corner
     * @param {number} x2 Abscissa of the lower right corner
     * @param {number} y2 Ordinate of the lower right corner
     * @returns {Item[]}
     */
    findEnclosed(x1, y1, x2, y2) {
        let items = [];
        let referrerBBox = new BBox(null, x1, y1, x2, y2);
        this.findAll().forEach((item) => {
            if (item.bbox != null) {
                if (referrerBBox.isEnclosedBy(item.bbox)) {
                    items.push(item);
                }
            }
        });
        return items;
    }
    /**
     * Returns each items that are included in the specified rectangle.
     * @public
     * @param {number} x1 Abscissa of the upper left corner
     * @param {number} y1 Ordinate of the upper left corner
     * @param {number} x2 Abscissa of the lower right corner
     * @param {number} y2 Ordinate of the lower right corner
     * @returns {Item[]}
     */
    findOverlapping(x1, y1, x2, y2) {
        let items = [];
        let referrerBBox = new BBox(null, x1, y1, x2, y2);
        this.findAll().forEach(item => {
            if (item.bbox != null) {
                if (referrerBBox.isIncludedBy(item.bbox)) {
                    items.push(item);
                }
            }
        });
        return items;
    }
    /**
     * Return each items including the point with the specified coordinates.
     * @public
     * @param {number} x Abscissa
     * @param {number} y Ordinate
     * @returns {Item[]}
     */
    findTargeted(x, y) {
        let items = [];
        this.findAll().forEach((item) => {
            if (item.bbox != null) {
                if (item.bbox.isTargetedBy(x, y)) {
                    items.push(item);
                }
            }
        });
        return items;
    }
    /**
     * Return the type of the specified item.
     * @public
     * @param {Item} item Item
     * @returns {string}
     */
    type(item) {
        return item.type;
    }
    /**
     * Rreturn the index of the specified item.
     * @public
     * @param {Item} item Item
     * @returns {number}
     */
    index(item) {
        return item.index;
    }
    /**
     * Change la vue du canvas.
     * @public
     * @param {number} x Abscissa of the new origin
     * @param {number} y Ordinate of the new origin
     */
    coordsView(x, y) {
        if (typeof this.options.scrollRegion != "undefined") {
            if (x < 0)
                this.x1 = -x < this.options.scrollRegion[1] ? x : -this.options.scrollRegion[1];
            else if (x > 0)
                this.x1 = x < this.options.scrollRegion[2] ? x : this.options.scrollRegion[2];
            else
                this.x1 = 0;
            if (y < 0)
                this.y1 = -y < this.options.scrollRegion[0] ? y : -this.options.scrollRegion[0];
            else if (y > 0)
                this.y1 = y < this.options.scrollRegion[3] ? y : this.options.scrollRegion[3];
            else
                this.y1 = 0;
            this.x2 = this.x1 + this.width;
            this.y2 = this.y1 + this.height;
            this.reload();
        }
        return;
    }
    /**
     * Move the canvas view.
     * @public
     * @param {number} dx Abscissa to increment
     * @param {number} dy Ordinate to increment
     */
    moveView(dx, dy) {
        return this.coordsView(this.x1 + dx, this.y1 + dy);
    }
    /**
     * Draw each item in the canvas.
     * @private
     */
    draw() {
        this.findAll().forEach(item => {
            item.draw();
        });
        return;
    }
    /**
     * Clear each item in the canvas.
     * @private
     */
    clear() {
        if (this.ctx != null) {
            if (typeof this.options.scrollRegion != "undefined") {
                this.ctx.clearRect(-this.options.scrollRegion[0], -this.options.scrollRegion[1], this.element.width + this.options.scrollRegion[2], this.element.height + this.options.scrollRegion[3]);
            }
        }
        return;
    }
    /**
     * Draw and clear each item in the canvas.
     * @public
     */
    reload() {
        this.clear();
        this.draw();
        return;
    }
    /**
     * Save the canvas as a PNG file.
     * @public
     * @param {string} fileName File name
     */
    save(fileName) {
        let link = document.createElement("a");
        link.href = this.element.toDataURL();
        link.download = (fileName || "canvas") + ".png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }
}
/**
 * Represents an item.
 */
class Item {
    /**
     * @constructor
     * @param {CanvAnim} canvas Canvas
     * @param {ItemOptions} [options] Options
     */
    constructor(canvas, options) {
        /**
         * CanvAnim object.
         * @public
         * @type {CanvAnim}
         */
        this.canvas = canvas;
        /**
         * Index of the item.
         * @public
         * @type {number}
         */
        this.index = null;
        /**
         * Kind of the item.
         * @public
         * @type {string}
         */
        this.type = "";
        /**
         * List of the tags of the item.
         * @public
         * @type {string[]}
         */
        this.tags = [];
        /**
         * Item options.
         * @public
         * @type {ItemOptions}
         */
        this.options = options;
        /**
         * BBox item (= hitbox).
         * @public
         * @type {BBox}
         */
        this.bbox = null;
        this.configure(options || null, false, false);
    }
    /**
     * Overlap the item in the canvas
     * @public
     * @param {boolean} [reload=true]
     */
    overlap(reload = true) {
        this.delete();
        this.index = this.canvas.findAll().push(this) - 1;
        if (reload || typeof reload === "undefined")
            this.canvas.reload();
        return;
    }
    /**
     * Change de coordonates of the item.
     * @public
     * @param {any} args Arguments
     */
    coords(...args) { }
    /**
     * Move the item.
     * @public
     * @param {any} args Arguments
     */
    move(...args) { }
    /**
     * Remove the item in the canvas.
     * @public
     * @param {boolean} [reload=true]
     */
    delete(reload) {
        delete this.canvas.findAll()[this.canvas.findAll().indexOf(this)];
        if (this.bbox != null)
            this.bbox.emit("delete", this);
        if (reload || typeof reload === "undefined")
            this.canvas.reload();
        return;
    }
    /**
     * Add the specified tag to the item.
     * @public
     * @param {string} tagName Tag name
     */
    addTag(tagName) {
        this.tags.push(tagName);
        return;
    }
    /**
     * Check if the item has the specified tag.
     * @public
     * @param {string} tagName Tag name
     * @returns {boolean}
     */
    hasTag(tagName) {
        return includes(this.tags, tagName);
    }
    /**
     * Remove the specified tag.
     * @public
     * @param {string} tagName Tag name
     */
    deleteTag(...tagsName) {
        tagsName.forEach((tagName) => {
            remove(this.tags, tagName);
        });
        return;
    }
    /**
     * Change the options of the item.
     * @public
     * @param {ItemOptions} [options] Options
     */
    configure(options, reload, draw) {
        if (this.canvas != null) {
            if (options != null) {
                // fusion
                let copy = Object.assign({}, DEFAULT_OPTIONS);
                this.options = Object.assign(copy, this.options);
                this.options = Object.assign(copy, options);
            }
            else {
                this.options = DEFAULT_OPTIONS;
            }
            if (draw || typeof draw === "undefined") {
                this.resetConfigure();
                if (this.canvas.ctx != null) {
                    if (this.options.backgroundColor != undefined && this.options.backgroundColor !== "tranparent") {
                        // couleur de fond
                        this.canvas.ctx.fillStyle = this.options.backgroundColor;
                        this.canvas.ctx.fill();
                    }
                    if (this.options.borderWidth != undefined && this.options.borderWidth) {
                        // border color
                        if (this.options.borderColor != undefined)
                            this.canvas.ctx.strokeStyle = this.options.borderColor;
                        // border width
                        this.canvas.ctx.lineWidth = this.options.borderWidth;
                        // // style des extrimités et des points de liaison
                        // switch (this.options.borderEndsStyle) {
                        //     case "round":
                        //         // rond
                        //         this.canvas.ctx.lineJoin =  "round"
                        //         this.canvas.ctx.lineCap = "round"
                        //         break
                        //     case "bevel":
                        //         // biseau
                        //         this.canvas.ctx.lineJoin = "bevel"
                        //         this.canvas.ctx.lineCap = "butt"
                        //         break
                        //     default:
                        //         // onglet (par défaut)
                        //         this.canvas.ctx.lineJoin = "miter"
                        //         this.canvas.ctx.lineCap = "square"
                        //         break
                        // }
                        if (this.options.borderStyle === "dashed")
                            // dashed border
                            this.canvas.ctx.setLineDash([this.options.borderWidth]);
                        else
                            // solid border
                            this.canvas.ctx.setLineDash([0, 0]);
                        this.canvas.ctx.stroke();
                    }
                    // shadows
                    if (this.options.shadowOffsetX != undefined)
                        this.canvas.ctx.shadowOffsetX = this.options.shadowOffsetX;
                    if (this.options.shadowOffsetY != undefined)
                        this.canvas.ctx.shadowOffsetY = this.options.shadowOffsetY;
                    if (this.options.shadowColor != undefined)
                        this.canvas.ctx.shadowColor = this.options.shadowColor;
                    if (this.options.shadowBlur != undefined)
                        this.canvas.ctx.shadowBlur = this.options.shadowBlur;
                }
            }
            if (reload || typeof reload === "undefined")
                this.canvas.reload();
        }
        return;
    }
    /**
     * Reset colors, fonts, border, etc... in the canvas.
     * @public
     */
    resetConfigure() {
        if (this.canvas.ctx != null) {
            // couleur de fond
            if (DEFAULT_OPTIONS.backgroundColor)
                this.canvas.ctx.fillStyle = DEFAULT_OPTIONS.backgroundColor;
            // couleur de bordure
            if (DEFAULT_OPTIONS.borderColor)
                this.canvas.ctx.strokeStyle = DEFAULT_OPTIONS.borderColor;
            // largeur de bordure
            if (DEFAULT_OPTIONS.borderWidth)
                this.canvas.ctx.lineWidth = DEFAULT_OPTIONS.borderWidth;
            this.canvas.ctx.lineJoin = "miter";
            // this.canvas.ctx.lineCap = DEFAULT_OPTIONS.borderEndsStyle
            this.canvas.ctx.setLineDash([0, 0]);
            // ombres
            if (DEFAULT_OPTIONS.shadowOffsetX != undefined)
                this.canvas.ctx.shadowOffsetX = DEFAULT_OPTIONS.shadowOffsetX; // décalage X
            if (DEFAULT_OPTIONS.shadowOffsetY != undefined)
                this.canvas.ctx.shadowOffsetY = DEFAULT_OPTIONS.shadowOffsetY; // décalage Y
            if (DEFAULT_OPTIONS.shadowColor != undefined)
                this.canvas.ctx.shadowColor = DEFAULT_OPTIONS.shadowColor; // couleur
            if (DEFAULT_OPTIONS.shadowBlur != undefined)
                this.canvas.ctx.shadowBlur = DEFAULT_OPTIONS.shadowBlur; // portée
        }
        return;
    }
    /**
     * Draw the item in the canvas
     * @public
     */
    draw() {
        return;
    }
}
/**
 * Represents BorderBox. /!\ Each shape has a rectangular bbox.
 * @extends EventsTrigger
 */
class BBox extends EventsTrigger {
    /**
     * @constructor
     * @param {Item|null} item Item
     * @param {number} x1 Abscissa of the upper left corner
     * @param {number} y1 Ordinate of the upper left corner
     * @param {number} x2 Abscissa of the lower right corner
     * @param {number} y2 Ordinate of the lower right corner
     */
    constructor(item, x1, y1, x2, y2) {
        var _a;
        super();
        /**
         * Item.
         * @public
         * @type {Item}
         */
        this.item = item;
        /**
         * CanvAnim.
         * @public
         * @type {CanvAnim}
         */
        this.canvas = item != null ? item.canvas : null;
        /**
         * Abscissa of the upper left corner of the bbox.
         * @public
         * @type {number}
         */
        this.x1 = x1;
        /**
         * Ordinate of the upper left corner of the bbox.
         * @public
         * @type {number}
         */
        this.y1 = y1;
        /**
         * Abscissa of the lower right corner of the bbox.
         * @public
         * @type {number}
         */
        this.x2 = x2;
        /**
         * Ordinate of the lower right corner of the bbox.
         * @public
         * @type {number}
         */
        this.y2 = y2;
        /**
         * Width of the bbox.
         * @public
         * @type {number}
         */
        this.width = x2 - x1;
        /**
         * Height of the bbox.
         * @public
         * @type {number}
         */
        this.height = y2 - y1;
        /**
         * Abscissa of the center of the bbox.
         * @public
         * @type {number}
         */
        this.x = x1 + this.width / 2;
        /**
         * Ordinate of the center of the bbox.
         * @public
         * @type {number}
         */
        this.y = x1 + this.height / 2;
        // Init events
        EVENTS.forEach((eventName) => {
            if (eventName !== "mouseenter" && eventName !== "mouseleave") {
                if (this.canvas != null && this.item != null) {
                    this.canvas.on(eventName, (e) => {
                        // console.log(e, e.target)
                        if (e.target.some((target) => { var _a; return target.index == ((_a = this.item) === null || _a === void 0 ? void 0 : _a.index); })) {
                            this.emit(eventName, e);
                        }
                    });
                }
            }
        });
        let mouseenter = (e) => {
            var _a, _b, _c;
            if (e.target && e.target.some((target) => { var _a; return target.index == ((_a = this.item) === null || _a === void 0 ? void 0 : _a.index); })) {
                this.emit("mouseenter", e);
                (_a = this.canvas) === null || _a === void 0 ? void 0 : _a.off("mousemove", mouseenter);
                (_b = this.canvas) === null || _b === void 0 ? void 0 : _b.on("mousemove", mouseleave);
                (_c = this.canvas) === null || _c === void 0 ? void 0 : _c.on("mouseleave", mouseleave);
            }
        };
        let mouseleave = (e) => {
            var _a, _b, _c;
            if (e.type == "mouseleave" || !e.target.some((target) => { var _a; return target.index == ((_a = this.item) === null || _a === void 0 ? void 0 : _a.index); })) {
                this.emit("mouseleave", e);
                (_a = this.canvas) === null || _a === void 0 ? void 0 : _a.off("mousemove", mouseleave);
                (_b = this.canvas) === null || _b === void 0 ? void 0 : _b.off("mouseleave", mouseleave);
                (_c = this.canvas) === null || _c === void 0 ? void 0 : _c.on("mousemove", mouseenter);
            }
        };
        (_a = this.canvas) === null || _a === void 0 ? void 0 : _a.on("mousemove", mouseenter);
        return;
    }
    /**
     * Define bbox coordonates with the specified coordontates.
     * @public
     * @param {number} x1 Abscissa of the upper left corner
     * @param {number} y1 Ordinate of the upper left corner
     * @param {number} [x2] Abscissa of the lower right corner
     * @param {number} [y2] Ordinate of the lower right corner
     */
    coords(x1, y1, x2, y2) {
        if (x2 && y2) {
            this.x2 = x2;
            this.y2 = y2;
            this.width = x2 - x1;
            this.height = y2 - y1;
        }
        else {
            this.x2 = x1 + this.width;
            this.y2 = y1 + this.height;
        }
        this.x1 = x1;
        this.y1 = y1;
        this.x = this.x1 + this.width / 2;
        this.y = this.y1 + this.height / 2;
        return;
    }
    /**
     * Move the bbox with the specified distances.
     * @public
     * @param {number} dx Abscissa difference
     * @param {number} dy Ordinate difference
     */
    move(dx, dy) {
        this.coords(this.x1 + dx, this.y1 + dy);
        return;
    }
    /**
     * Change the cursor when hovering over the bbox.
     * @param {string} cursorName Name or URL
     */
    setCursor(cursorName) {
        this.on("mouseenter", (e) => {
            if (this.canvas != null)
                this.canvas.element.style.cursor = includes(CURSORS, cursorName) ? cursorName : "url(" + cursorName + ")";
        });
        this.on("mouseleave", (e) => {
            if (this.canvas != null)
                this.canvas.element.style.cursor = "auto";
        });
        return;
    }
    /**
     * Check if the sepcified item is included in the bbox.
     * @param {BBox} bbox BBox
     * @returns {boolean}
     */
    isIncludedBy(bbox) {
        return (bbox.x2 >= this.x1 && bbox.x1 <= this.x2) && (bbox.y2 >= this.y1 && bbox.y1 <= this.y2);
    }
    /**
     * Check if the specified item is included entierly in the bbox.
     * @param {BBox} bbox BBox
     * @returns {boolean}
     */
    isEnclosedBy(bbox) {
        return (this.x1 <= bbox.x1 && this.x2 >= bbox.x2) && (this.y1 <= bbox.y1 && this.y2 >= bbox.y2);
    }
    /**
     * Check if the point with the specified coordonates is included in the bbox.
     * @param {number} x Abscisse
     * @param {number} y Ordinate
     * @returns {boolean}
     */
    isTargetedBy(x, y) {
        return (x >= this.x1 && x <= this.x2) && (y >= this.y1 && y <= this.y2);
    }
}
/**
 * Represents a line.
 * @extends Item
 */
class LineItem extends Item {
    /**
     * @constructor
     * @param {CanvAnim} canvas Canvas
     * @param {number} x1 Starting point abscissa
     * @param {number} y1 Starting point computer
     * @param {number} x2 End point abscissa
     * @param {number} y2 Endpoint ordinate
     * @param {ItemOptions} [options] Options
     */
    constructor(canvas, x1, y1, x2, y2, options) {
        super(canvas, options);
        this.type = "line";
        /**
         * Abscissa of the upper left corner of the line.
         * @private
         * @type {number}
         */
        this.x1 = x1;
        /**
         * Ordinate of the upper left corner of the line.
         * @private
         * @type {number}
         */
        this.y1 = y1;
        /**
         * Abscissa of the lower right corner of the line.
         * @private
         * @type {number}
         */
        this.x2 = x2;
        /**
         * Ordinate of the lower right corner of the line.
         * @private
         * @type {number}
         */
        this.y2 = y2;
    }
    /**
     * Define line coordinates with the specified coordonates.
     * @public
     * @param  {...any[]} args New coordonates
     */
    coords(...args) {
        let reload = false;
        if (args.length >= 4) {
            [this.x1, this.y1, this.x2, this.y2] = args;
            reload = args[4] || typeof args[4] === "undefined" ? true : false;
        }
        else if (args.length >= 2) {
            if (typeof this.x2 == "number" && typeof this.y2 == "number" && typeof this.x1 == "number" && typeof this.y1 == "number") {
                let dx = this.x2 - this.x1;
                let dy = this.y2 - this.y1;
                this.x1 = args[0];
                this.y1 = args[1];
                if (typeof this.x1 == "number" && typeof this.y1 == "number") {
                    this.x2 = this.x1 + dx;
                    this.y2 = this.y1 + dy;
                }
                reload = args[2] || typeof args[2] === "undefined" ? true : false;
            }
        }
        if (reload)
            this.canvas.reload();
        return;
    }
    /**
     * Moves the line with the specified distances.
     * @public
     * @param {number} dx Abscissa difference
     * @param {number} dy Ordinate difference
     * @param {boolean} [reload=true]
     */
    move(dx, dy, reload) {
        this.coords(this.x1 + dx, this.y1 + dy, reload);
        return;
    }
    /**
     * Draw the line in the canvas.
     * @public
     */
    draw() {
        if (this.canvas.ctx != null) {
            this.canvas.ctx.beginPath();
            this.canvas.ctx.moveTo(this.canvas.x1 + this.x1, this.canvas.y1 + this.y1);
            this.canvas.ctx.lineTo(this.canvas.x1 + this.x2, this.canvas.y1 + this.y2);
            this.configure(this.options || null, false);
            this.canvas.ctx.closePath();
        }
        return;
    }
}
/**
 * Represents a Bezier curve.
 * @extends Item
 */
class CurveItem extends Item {
    /**
     * @constructor
     * @param {CanvAnim} canvas Canvas
     * @param {number} x1 Starting point abscissa
     * @param {number} y1 Starting point ordinate
     * @param {number} x2 End point abscissa
     * @param {number} y2 End point ordinate
     * @param {number} cp1x Abscissa of the first point of control
     * @param {number} cp1y Order of the first point of control
     * @param {number} cp2x Abscissa of the second point of control
     * @param {number} cp2y Order of the second point of control
     * @param {ItemOptions} [options] Options
     */
    constructor(canvas, x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y, options) {
        super(canvas, options);
        /**
         * Kind of the item.
         * @public
         * @type {string}
         */
        this.type = "curve";
        /**
         * Abscissa of the upper left corner of the curve.
         * @private
         * @type {number}
         */
        this.x1 = x1;
        /**
         * Ordinate of the upper left corner of the curve.
         * @private
         * @type {number}
         */
        this.y1 = y1;
        /**
         * Abscissa of the lower right corner of the curve.
         * @private
         * @type {number}
         */
        this.x2 = x2;
        /**
         * Ordinate of the lower right corner of the curve.
         * @private
         * @type {number}
         */
        this.y2 = y2;
        /**
         * Abscissa first control point of the curve.
         * @private
         * @type {number}
         */
        this.cp1x = cp1x;
        /**
         * Ordinate first control point of the curve.
         * @private
         * @type {number}
         */
        this.cp1y = cp1y;
        /**
         * Abscissa second control point of the curve.
         * @private
         * @type {number}
         */
        this.cp2x = cp2x;
        /**
         * Ordinate second control point of the curve.
         * @private
         * @type {number}
         */
        this.cp2y = cp2y;
    }
    /**
     * Define curve coordinates with the specified coordonates.
     * @public
     * @param  {...number} args New coordonates
     */
    coords(...args) {
        let reload = true;
        if (args.length >= 8) {
            [this.x1, this.y1, this.x2, this.y2, this.cp1x, this.cp1y, this.cp2x, this.cp2y] = args;
            reload = args[8] || typeof args[8] === "undefined" ? true : false;
        }
        else if (args.length >= 2) {
            let dx = this.x2 - this.x1;
            let dy = this.y2 - this.y1;
            let dcp1x = this.cp1x - this.x1;
            let dcp1y = this.cp1y - this.y1;
            let dControl2X = this.cp2x - this.x1;
            let dcp2y = this.cp2y - this.y1;
            this.x1 = args[0];
            this.y1 = args[1];
            this.cp1x = this.x1 + dcp1x;
            this.cp1y = this.y1 + dcp1y;
            this.cp2x = this.x1 + dControl2X;
            this.cp2y = this.y1 + dcp2y;
            this.x2 = this.x1 + dx;
            this.y2 = this.y1 + dy;
            reload = args[2] || typeof args[2] === "undefined" ? true : false;
        }
        else { /* Error */ }
        if (reload)
            this.canvas.reload();
        return;
    }
    /**
     * Moves the Bezier curve with the specified distances.
     * @public
     * @param {number} dx Abscissa difference
     * @param {number} dy Ordinate difference
     * @param {boolean} [reload=true]
     */
    move(dx, dy, reload) {
        this.coords(this.x1 + dx, this.y1 + dy, reload);
        return;
    }
    /**
     * Draw the curve in the canvas.
     * @public
     */
    draw() {
        if (this.canvas.ctx != null) {
            this.canvas.ctx.beginPath();
            this.canvas.ctx.moveTo(this.canvas.x1 + this.x1, this.canvas.y1 + this.y1);
            this.canvas.ctx.bezierCurveTo(this.canvas.x1 + this.cp1x, this.canvas.y1 + this.cp1y, this.canvas.x1 + this.cp2x, this.canvas.y1 + this.cp2y, this.canvas.x1 + this.x2, this.canvas.y1 + this.y2);
            this.configure(this.options || null, false);
            this.canvas.ctx.closePath();
        }
        return;
    }
}
/**
 * Represents a rectangle.
 * @extends Item
 */
class RectangleItem extends Item {
    /**
     * @constructor
     * @param {CanvAnim} canvas Canvas
     * @param {number} x Abscissa of the upper left corner
     * @param {number} y Ordinate of the upper left corner
     * @param {number} width Width
     * @param {number} height Height
     * @param {ItemOptions} [options] Options
     */
    constructor(canvas, x, y, width, height, options) {
        super(canvas, options);
        /**
         * Kind of the item.
         * @public
         * @type {string}
         */
        this.type = "rectangle";
        /**
         * bbox of the rectangle.
         * @public
         * @type {string}
         */
        this.bbox = new BBox(this, x, y, x + width, y + height);
        /**
         * Abscissa of the center of the rectangle.
         * @private
         * @type {number}
         */
        this.x = x;
        /**
         * Ordinate of the center of the rectangle.
         * @private
         * @type {number}
         */
        this.y = y;
        /**
         * Width of the rectangle.
         * @private
         * @type {number}
         */
        this.width = width;
        /**
         * Height of the rectangle.
         * @private
         * @type {number}
         */
        this.height = height;
    }
    /**
     * Define rectangle coordonates with the specified coordontates.
     * @public
     * @param {number} x Abscissa of the upper left corner
     * @param {number} y Ordinate of the upper left corner
     * @param {number} [width] Width of the rectangle
     * @param {number} [height] Height of the rectangle
     */
    coords(x, y, width, height, reload) {
        if (this.bbox != null)
            this.bbox.coords(x, y, x + (width || this.width), y + (height || this.height));
        if (width && height) {
            this.width = width;
            this.height = height;
        }
        this.x = x;
        this.y = y;
        if (reload || typeof reload === "undefined")
            this.canvas.reload();
        return;
    }
    /**
     * Move the rectangle with the specified distances.
     * @public
     * @param {number} dx Abscissa difference
     * @param {number} dy Ordinate difference
     * @param {boolean} [reload=true]
     */
    move(dx, dy, reload) {
        this.coords(this.x + dx, this.y + dy, undefined, undefined, reload);
        return;
    }
    /**
     * Draw the rectangle in the canvas.
     * @public
     */
    draw() {
        if (this.canvas.ctx != null) {
            this.canvas.ctx.beginPath();
            this.canvas.ctx.moveTo(this.canvas.x1 + this.x, this.canvas.y1 + this.y);
            this.canvas.ctx.rect(this.canvas.x1 + this.x, this.canvas.y1 + this.y, this.width, this.height);
            this.configure(this.options || null, false);
            this.canvas.ctx.closePath();
        }
        return;
    }
}
/**
 *  Represents an ellipse.
 *  @extends Item
 */
class EllipseItem extends Item {
    /**
     * @constructor
     * @param {CanvAnim} canvas Canvas
     * @param {number} x Center abscissa
     * @param {number} y Center ordinate
     * @param {number} rx Radius Y
     * @param {number} ry Radius X
     * @param {ItemOptions} [options] Options
     */
    constructor(canvas, x, y, rx, ry, options) {
        super(canvas, options);
        /**
         * Kind of the item.
         * @public
         * @type {number}
         */
        this.type = "ellipse";
        /**
         * Ellipse bbox /!\ the bbox is rectangle.
         * @public
         * @type {BBox}
         */
        this.bbox = new BBox(this, x - rx, y - ry, x + rx, y + ry);
        /**
         * Abscissa of the center of the ellipse.
         * @private
         * @type {number}
         */
        this.x = x;
        /**
         * Ordinate of the center of the ellipse.
         * @private
         * @type {number}
         */
        this.y = y;
        /**
         * Y radius of the ellipse.
         * @private
         * @type {number}
         */
        this.rx = rx;
        /**
         * X radius of the ellipse.
         * @private
         * @type {number}
         */
        this.ry = ry;
    }
    /**
     * Define rectangle coordonates with the specified coordontates.
     * @public
     * @param {number} x1 Abscissa of the upper left corner
     * @param {number} y1 Ordinate of the upper left corner
     * @param {number} [rx] Abscissa of the lower right corner
     * @param {number} [ry] Ordinate of the lower right corner
     */
    coords(x, y, rx, ry, reload) {
        if (this.bbox != null)
            this.bbox.coords(x - (rx || this.rx), y - (ry || this.ry), x + (rx || this.rx), y + (ry || this.ry));
        if (rx && ry) {
            this.rx = rx;
            this.ry = ry;
        }
        this.x = x;
        this.y = y;
        if (reload || typeof reload === "undefined")
            this.canvas.reload();
        return;
    }
    /**
     * Move the rectangle with the specified distances.
     * @public
     * @param {number} dx Abscissa difference
     * @param {number} dy Ordinate difference
     * @param {boolean} [reload=true]
     */
    move(dx, dy, reload) {
        this.coords(this.x + dx, this.y + dy, undefined, undefined, reload);
        return;
    }
    /**
     * Draw the ellipse.
     * @public
     */
    draw() {
        if (this.canvas.ctx != null) {
            this.canvas.ctx.beginPath();
            this.canvas.ctx.moveTo(this.canvas.x1 + this.x + this.rx, this.canvas.y1 + this.y);
            this.canvas.ctx.ellipse(this.canvas.x1 + this.x, this.canvas.y1 + this.y, this.rx, this.ry, 0, 0, 2 * Math.PI);
            this.configure(this.options || null, false);
            this.canvas.ctx.closePath();
        }
        return;
    }
}
/**
 * Represents an arc.
 * @extends Item
 */
class ArcItem extends Item {
    /**
     * @constructor
     * @param {CanvAnim} canvas Canvas
     * @param {number} x Center abscissa
     * @param {number} y Center Ordinate
     * @param {number} r Radius
     * @param {number} start Start angle
     * @param {number} extent End angle
     * @param {boolean} anticlockwise Arc filling direction (clockwise by default)
     * @param {ItemOptions} [options] Options
     */
    constructor(canvas, x, y, r, start, extent, anticlockwise, options) {
        super(canvas, options);
        /**
         * Kind of the item.
         * @public
         * @type {string}
         */
        this.type = "arc";
        /**
         * Abscissa of the center of the arc.
         * @private
         * @type {number}
         */
        this.x = x;
        /**
         * Ordinate of the center of the arc.
         * @private
         * @type {number}
         */
        this.y = y;
        /**
         * Radius of the arc.
         * @private
         * @type {number}
         */
        this.r = r;
        /**
         * Start angle.
         * @private
         * @type {number}
         */
        this.start = typeof start !== "undefined" ? start : 0;
        /**
         * End angle.
         * @private
         * @type {number}
         */
        this.extent = typeof extent !== "undefined" ? extent : 2 * Math.PI;
        /**
         * Arc filling direction (clockwise by default).
         * @private
         * @type {number}
         */
        this.anticlockwise = typeof anticlockwise !== "undefined" ? anticlockwise : true;
        /**
         * Arc Bbox.
         * @public
         * @type {BBox}
         */
        this.bbox = new BBox(this, x - r, y - r, x + r, y + r);
    }
    /**
     * Change the coordonates with the specified coordonates
     * @public
     * @param {number} x1 Center abscissa
     * @param {number} y1 Center ordinate
     * @param {number} [r] Radius
     * @param {boolean} [reload=true]
     */
    coords(x, y, r, reload) {
        if (this.bbox != null)
            this.bbox.coords(x - (r || this.r), y - (r || this.r), x + (r || this.r), y + (r || this.r));
        if (typeof r != "undefined") {
            this.r = r;
        }
        this.x = x;
        this.y = y;
        if (reload || typeof reload === "undefined")
            this.canvas.reload();
        return;
    }
    /**
     * Move the rectangle with the specified distances
     * @public
     * @param {number} dx Abscissa difference
     * @param {number} dy Ordinate difference
     * @param {boolean} [reload=true]
     */
    move(dx, dy, reload) {
        this.coords(this.x + dx, this.x + dy, undefined, reload);
        return;
    }
    /**
     * Draw the arc in the canvas
     * @public
     */
    draw() {
        if (this.canvas.ctx != null) {
            this.canvas.ctx.beginPath();
            this.canvas.ctx.moveTo(this.canvas.x1 + this.x, this.canvas.y1 + this.y);
            this.canvas.ctx.arc(this.canvas.x1 + this.x, this.canvas.y1 + this.y, this.r, this.start, this.extent, this.anticlockwise);
            this.canvas.ctx.lineTo(this.canvas.x1 + this.x, this.canvas.y1 + this.y);
            this.configure(this.options || null, false);
            this.canvas.ctx.closePath();
        }
        return;
    }
}
/**
 * Represents an image.
 * @extends Item
 */
class ImageItem extends Item {
    /**
     * @constructor
     * @param {CanvAnim} canvas Canvas
     * @param {number} x Abscissa of the upper left corner
     * @param {number} y Ordinate of the upper left corner
     * @param {number} width Width
     * @param {number} height Height
     * @param {string} url URL
     * @param {ItemOptions} [options] Options
     */
    constructor(canvas, x, y, width, height, url, options) {
        super(canvas, options);
        /**
         * Kind of the item.
         * @public
         * @type {string}
         */
        this.type = "image";
        /**
         * Img prototype.
         * @private
         * @type {HTMLImageElement}
         */
        this.img = new Image();
        /**
         * Abscissa of the center of the image.
         * @private
         * @type {number}
         */
        this.x = x;
        /**
         * Ordinate of the center of the image.
         * @private
         * @type {number}
         */
        this.y = y;
        /**
         * Width of the image.
         * @private
         * @type {number}
         */
        this.width = width;
        /**
         * Height of the image.
         * @private
         * @type {number}
         */
        this.height = height;
        this.img.src = url;
        this.img.width = width;
        this.img.height = height;
        /**
         * BBox of the image.
         * @private
         * @type {number}
         */
        this.bbox = new BBox(this, x, y, x + width, y + height);
        /**
         * Function called when the image is loaded.
         * @private
         * @type {Function}
         */
        this.onload = null;
        this.img.onload = (e) => {
            if (typeof this.onload == "function")
                this.onload(e);
        };
    }
    /**
     * Change the image URL.
     * @public
     * @param {string} url URL
     */
    setURL(url) {
        this.img.src = url;
        this.canvas.reload();
        return;
    }
    /**
     * Change the coordonates with the specified coordonates.
     * @public
     * @param {number} x1 Abscissa of the upper left corner
     * @param {number} y1 Ordinate of the upper left corner
     * @param {number} [x2] Abscissa of the lower right corner
     * @param {number} [y2] Ordinate of the lower right corner
     * @param {boolean} [reload=true]
     */
    coords(x, y, width, height, reload) {
        if (this.bbox != null)
            this.bbox.coords(x, y, x + (width || this.width), y + (height || this.height));
        if (width && height) {
            this.width = width;
            this.height = height;
        }
        this.x = x;
        this.y = y;
        if (reload || typeof reload === "undefined")
            this.canvas.reload();
        return;
    }
    /**
     * Move the rectangle with the specified distances.
     * @public
     * @param {number} dx Abscissa difference
     * @param {number} dy Ordinate difference
     * @param {boolean} [reload=true]
     */
    move(dx, dy, reload) {
        this.coords(this.x + dx, this.y + dy, undefined, undefined, reload);
        return;
    }
    /**
     * Draw the image in the canvas.
     * @public
     */
    draw() {
        if (this.canvas.ctx != null) {
            this.canvas.ctx.beginPath();
            this.canvas.ctx.moveTo(this.canvas.x1 + this.x, this.canvas.y1 + this.y);
            this.canvas.ctx.rect(this.canvas.x1 + this.x, this.canvas.y1 + this.y, this.width, this.height);
            this.canvas.ctx.drawImage(this.img, this.canvas.x1 + this.x, this.canvas.y1 + this.y, this.img.width, this.img.height);
            this.configure(this.options || null, false);
            this.canvas.ctx.closePath();
        }
        return;
    }
}
/**
 * Represents a text.
 * @extends Item
 * */
class TextItem extends Item {
    /**
     * @constructor
     * @param {CanvAnim} canvas Canvas
     * @param {string} text Text to show
     * @param {number} x Abscissa
     * @param {number} y Ordinate
     * @param {ItemOptions} [options] Options
     */
    constructor(canvas, text, x, y, options) {
        super(canvas, options);
        /**
         * Kind of the item.
         * @public
         * @type {string}
         */
        this.type = "text";
        /**
         * Abscissa of the left upper corner of the text.
         * @private
         */
        this.x = x;
        /**
         * Ordinate of the left upper corner of the text.
         * @private
         */
        this.y = y;
        /**
         * Text to show.
         * @private
         */
        this.text = text;
    }
    /**
     * Change the options of the text.
     * @public
     * @param {ItemOptions} [options] Options
     */
    configure(options, reload) {
        this.resetConfigure();
        super.configure(options, false);
        if (this.options && this.canvas.ctx != null) {
            if (this.options.textStrokeWidth) {
                this.canvas.ctx.lineWidth = this.options.textStrokeWidth;
                if (typeof this.options.textStrokeColor != "undefined")
                    this.canvas.ctx.strokeStyle = this.options.textStrokeColor;
                this.canvas.ctx.strokeText(this.text, this.x, this.y);
            }
            this.canvas.ctx.font = this.options.fontSize + "px " + (this.options.fontFamily);
            if (typeof this.options.color != "undefined")
                this.canvas.ctx.fillStyle = this.options.color;
            // this.canvas.ctx.textAlign = this.options.textAlign
            this.canvas.ctx.textBaseline = "top";
        }
        if (reload)
            this.canvas.reload();
        return;
    }
    /**
     * Reset the colors, borders, the font in the canvas.
     * @public
     */
    resetTextConfigure() {
        if (this.canvas.ctx != null) {
            if (typeof DEFAULT_OPTIONS.textStrokeWidth != "undefined")
                this.canvas.ctx.lineWidth = DEFAULT_OPTIONS.textStrokeWidth;
            if (typeof DEFAULT_OPTIONS.textStrokeColor != "undefined")
                this.canvas.ctx.strokeStyle = DEFAULT_OPTIONS.textStrokeColor;
            if (typeof DEFAULT_OPTIONS.color != "undefined")
                this.canvas.ctx.fillStyle = DEFAULT_OPTIONS.color;
            this.canvas.ctx.font = DEFAULT_OPTIONS.fontSize + "px " + (DEFAULT_OPTIONS.fontFamily);
            // this.canvas.ctx.textAlign = DEFAULT_OPTIONS.textAlign
        }
        return;
    }
    /**
     * Change the coordonates with the specified coordonates.
     * @public
     * @param {number} x1 Abscissa of the upper left corner
     * @param {number} y1 Ordinate of the upper left corner
     * @param {boolean} [reload=true]
     */
    coords(x, y, reload) {
        this.x = x;
        this.y = y;
        if (reload || typeof reload === "undefined")
            this.canvas.reload();
        return;
    }
    /**
     * Move the rectangle with the specified distances.
     * @public
     * @param {number} dx Abscissa difference
     * @param {number} dy Ordinate difference
     * @param {boolean} [reload=true]
     */
    move(dx, dy, reload) {
        this.coords(this.x + dx, this.y + dy, reload);
        return;
    }
    /**
     * setText
     */
    setText(text, reload = true) {
        this.text = text.toString();
        if (reload || typeof reload === "undefined")
            this.canvas.reload();
    }
    /**
     * Draw the text in the canvas.
     * @public
     */
    draw() {
        if (this.canvas.ctx) {
            this.canvas.ctx.beginPath();
            this.canvas.ctx.moveTo(this.canvas.x1 + this.x, this.canvas.y1 + this.y);
            super.configure(this.options || null, false);
            if (typeof this.options != "undefined" && typeof this.options.fontSize != "undefined" && typeof DEFAULT_OPTIONS.fontSize != "undefined") {
                this.canvas.ctx.rect(this.canvas.x1 + this.x, this.canvas.y1 + this.y, this.canvas.x1 + this.canvas.ctx.measureText(this.text).width, this.canvas.y1 + (this.options.fontSize || DEFAULT_OPTIONS.fontSize));
            }
            this.configure(this.options || null, false);
            this.canvas.ctx.fillText(this.text, this.canvas.x1 + this.x, this.canvas.y1 + this.y);
            this.canvas.ctx.closePath();
        }
        return;
    }
}
/**
 * Remove an element of the array.
 * @param {any[]} arr Array
 * @param {any} element Element to delete
 * @returns {any}
 */
function remove(arr, element) {
    let i = arr.indexOf(element);
    if (i > -1) {
        arr.splice(i, 1);
        return element;
    }
    else {
        return false;
    }
}
/**
 * Check if the specified element is included in the specified array.
 * @param {any[]} arr Array
 * @param {any} element Element to search
 * @returns {boolean}
 */
function includes(arr, element) {
    return arr.some((value) => {
        return value == element;
    });
}
module.exports.CanvAnim = CanvAnim

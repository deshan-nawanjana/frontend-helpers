const Hexa = class {
    // constructor for component
    constructor(input, options) {
        // that identifier
        const that = this
        // get root element by type
        this.element = typeof input === 'object'
            // element as input
            ? input
            // element by query selector
            : document.querySelector(input)
        // attach component to element
        this.element._hexa = that
        // clone html content
        const html = Hexa.cloneComponentHTML(this.element).outerHTML
        // state data
        this.data = {}
        // references data
        this.refs = {}
        // methods
        this.methods = {}
        // if any methods
        if(options.methods) {
            // get methods key array
            const mrr = Object.keys(options.methods)
            // for each method
            for(let i = 0; i < mrr.length; i++) {
                // current method key
                const key = mrr[i]
                // current method
                const mtd = options.methods[key]
                // set current method to component
                this.methods[key] = function(...args) {
                    // call method with arguments
                    mtd.call(that, ...args)
                }
            }
        }
        // bind targets array
        let binds = []
        // method to update
        this.update = (state = this.data) => {
            // update from data to state inputs
            Hexa.update(binds, this.data, state, this.methods, this)
        }
        // get nodes
        const nodes = Hexa.getNodes(this.element)
        // get bind direct targets
        binds = Hexa.bindTargets(nodes)
        // bind methods
        Hexa.bindMethods(this.element, this.methods || {}, options.data || {})
        // get references
        Hexa.setReferences(this, this.element, null)
        // init update
        this.update(options.data || {})
        // clone method
        this.clone = (states = {}) => {
            // clone data content
            const data = Object.assign({}, this.data || {})
            // get new state keys
            const sarr = Object.keys(states)
            // for each state key
            for(let i = 0; i < sarr.length; i++) {
                // current key
                const key = sarr[i]
                // update data object
                data[key] = states[key]
            }
            // create parser
            const parser = new DOMParser()
            // parse html
            const domout = parser.parseFromString(html, 'text/html')
            // get element
            const element  = domout.body.children[0]
            // remove id attribute
            element.removeAttribute('id')
            // create options
            const optdata = { data : data, methods : options.methods }
            // create hexa clone
            const clone = new Hexa(element, optdata)
            // return clone
            return clone
        }
    }
}

// global component references
Hexa.comps = {}
// global element references
Hexa.globs = {}

// method to clone component template
Hexa.cloneComponentHTML = node => {
    // clone root node
    const clone = node.cloneNode(true)
    // get inner hexa components elements
    const other = clone.querySelectorAll('[\\@hexa]')
    //for each element
    for(let i = 0; i < other.length; i++) {
        // remove element
        other[i].remove()
    }
    return clone
}

// method to return all nodes as array
Hexa.getNodes = (root, onlyElements = false) => {
    // output array
    const out = [ root ]
    // recursive method
    const rec = parent => {
        // get child nodes
        const arr = parent.childNodes
        // for each child
        for(let i = 0; i < arr.length; i++) {
            // current node
            const node = arr[i]
            // continue for internal hexa components
            if(node.nodeType === 1 && (node.hasAttribute('@hexa') || node._hexa)) { continue }
            // continue for internal ignore element
            if(node.nodeType === 1 && (node.hasAttribute('@ignore') || node._ignore)) { continue }
            // continue for internal list element
            if(node.nodeType === 1 && (node.hasAttribute('@list'))) {
                out.push(node)
                continue
            }
            // check only elements mode
            if(onlyElements && node.nodeType === 1 || !onlyElements) {
                // push to output
                out.push(node)
            }
            // run recursive
            rec(node)
        }
    }
    // start recursive
    rec(root)
    // return output array
    return out
}

Hexa.getBinds = text => {
    // output object
    const out = { text : [], points : [] }
    // reg exp to match double curly braces
    const exp_1 = new RegExp(/(?<=\{\{).*?(?=\}\})/)
    // reg exp to split expression by symbols
    const exp_2 = (/\(|\)|\[|\]|\{|\}|\'|\"|\+|\-|\*|\/|\%|\||\?|\:|\;|\,|\=|\.| /g)
    // current match
    let match = text.match(exp_1)
    // while match available
    while(match) {
        // get pre text
        const ptxt = text.substr(0, match.index - 2)
        // get matched data
        const data = match[0]
        // get path by replacing spaces, brackets and quotes
        const path = data.replace(/ |]|'|"|`/g, '').replace(/\[/g, '.').split('.')
        out.points = out.points.concat(data.split(exp_2).filter(x => x !== ''))
        // get first key of path
        const head = path[0]
        // get index of point
        const indx = out.points.indexOf(head)
        // push pre text to output
        out.text.push(ptxt)
        // push points to output
        out.text.push({ index : indx, path : path, eval : data })
        // trim text from match
        text = text.substr(match.index + data.length + 2)
        // get next match
        match = text.match(exp_1)
    }
    // push end of text
    out.text.push(text)
    // check for output matches
    if(out.points.length > 0) {
        // return output
        return out
    } else {
        // return null for no binds
        return null
    }
}

Hexa.getVisibleData = node => {
    // check visible attribute
    if(node.hasAttribute('@visible')) {
        // get visible attribute key
        const show = node.getAttribute('@visible')
        // remove attribute
        node.removeAttribute('@visible')
        // return key
        return show
    } else {
        // no visible attribute
        return null
    }
}

Hexa.getListData = node => {
    // check list attribute
    if(node.hasAttribute && node.hasAttribute('@list')) {
        // get list attribute key
        const text = node.getAttribute('@list')
        // remove attribute
        node.removeAttribute('@list')
        // clone node template
        const temp = Hexa.cloneComponentHTML(node)
        // split data
        const data = text.split(/ in | at /g)
        // return data
        return {
            item : data[0],
            array : data[1],
            index : data[2],
            temp : temp,
            list : []
        }
    } else {
        // no list attribute
        return null
    }
}

// method to find target binds with states
Hexa.bindTargets = nodes => {
    // output array
    const out = []
    // for each node
    for(let i = 0; i < nodes.length; i++) {
        // current node
        const node = nodes[i]
        // check for node type
        if(node.nodeType === 1) {
            // check for attrs attribute
            if(node.hasAttribute('@attrs') && node.hasAttribute('@list') === false) {
                // push to output
                out.push({ 
                    data : node.getAttribute('@attrs'),
                    node : node,
                    type : 'attrs',
                    list : []
                })
                // remove attrs attribute
                node.removeAttribute('@attrs')
            }
        }
        // get list data
        const list = Hexa.getListData(node)
        // check for match result
        if(list && i !== 0) {
            // create a text node
            const text = document.createTextNode('')
            // replace with node
            node.replaceWith(text)
            // push to output
            out.push({ 
                data : list,
                node : text,
                type : 'list'
            })
            // continue to next node
            continue
        }
        // get attributes
        const attrs = node.attributes
        // check for an element
        if(attrs) {
            // for each attribute
            for(let a = 0; a < attrs.length; a++) {
                // current attribute
                const attr = attrs[a]
                // get bind matches data
                const data = Hexa.getBinds(attr.value)
                // check for match result
                if(data) {
                    // push to output
                    out.push({ 
                        data : data,
                        node : node,
                        type : 'attr',
                        name : attr.name
                    })
                }
                // get visible data
                const show = Hexa.getVisibleData(node)
                // check for match result
                if(show) {
                    // push to output
                    out.push({ 
                        data : show + ';',
                        node : node,
                        type : 'show'
                    })
                }
            }
        } else {
            // get text node data
            const data = Hexa.getBinds(node.data)
            // check for match result
            if(data) {
                // push to output
                out.push({ 
                    data : data,
                    node : node,
                    type : 'text'
                })
            }
        }
    }
    // return output
    return out
}

// method to bind events to elements
Hexa.bindMethods = (root, methods, states, listData = {}) => {
    // get all elements with events
    const arr = Hexa.getNodes(root, true).filter(x => {
        // filter elements with event attributes
        return Hexa.bindMethods.types.some(e => x.hasAttribute(':' + e))
    })
    // for each elements
    for(let i = 0; i < arr.length; i++) {
        // current elements
        const itm = arr[i]
        // get all event types for the elements
        const trr = Hexa.bindMethods.types.filter(x => arr[i].hasAttribute(':' + x))
        // for each event type
        for(let t = 0; t < trr.length; t++) {
            // current event type
            const typ = trr[t]
            // current type attribute
            const atr = ':' + typ
            // get method value
            const mtd = itm.getAttribute(atr)
            // remove attribute
            itm.removeAttribute(atr)
            // get method name
            const name = mtd.split('(')[0]
            // get args
            const args = mtd.includes('(')
                // parse args
                ? mtd.substr(name.length + 1, mtd.length - name.length - 2)
                // no args
                : null
            // add event listener
            itm.addEventListener(typ, function(event) {
                // check method availability
                if(typeof methods[name] === 'function') {
                    if(args === null) {
                        // call method with event
                        methods[name](event)
                    } else {
                        // event and element object
                        const stat = listData
                        // clone states into object
                        Object.assign(stat, states)
                        // create function to get args
                        const afnc = Hexa.createFunction(stat, `[${args}]`)
                        // get args from function
                        const data = afnc(stat)
                        // call method
                        methods[name](...data)
                    }
                }
            })
        }
    }
}

// array of all event types
Hexa.bindMethods.types = [
    "abort", "animationcancel", "animationend", "animationiteration", "animationstart",
    "auxclick", "blur", "canplay", "canplaythrough", "change", "click", "close",
    "contextmenu", "cuechange", "dblclick", "drag", "dragend", "dragenter",
    "dragleave", "dragover", "dragstart", "drop", "durationchange", "emptied",
    "ended", "error", "focus", "formdata", "gotpointercapture", "input", "invalid",
    "keydown", "keypress", "keyup", "load", "loadeddata", "loadedmetadata",
    "loadstart", "lostpointercapture", "mousedown", "mouseenter", "mouseleave",
    "mousemove", "mouseout", "mouseover", "mouseup", "pause", "play", "playing",
    "pointercancel", "pointerdown", "pointerenter", "pointerleave", "pointermove",
    "pointerout", "pointerover", "pointerup", "progress", "ratechange", "reset",
    "resize", "scroll", "securitypolicyviolation", "seeked", "seeking", "select",
    "selectionchange", "selectstart", "slotchange", "stalled", "submit", "suspend",
    "timeupdate", "toggle", "touchcancel", "touchend", "touchmove", "touchstart",
    "transitioncancel", "transitionend", "transitionrun", "transitionstart",
    "volumechange", "waiting", "webkitanimationend", "webkitanimationiteration",
    "webkitanimationstart", "webkittransitionend", "wheel", "afterprint",
    "beforeprint", "beforeunload", "gamepadconnected", "gamepaddisconnected",
    "hashchange", "languagechange", "message", "messageerror", "offline",
    "online", "pagehide", "pageshow", "popstate", "rejectionhandled", "storage",
    "unhandledrejection", "unload"
]

Hexa.setReferences = (that, root, index) => {
    // remove hexa attribute
    root.removeAttribute('@hexa')
    // get all ignore nodes
    const irr = root.querySelectorAll('[\\@ignore]')
    // for each ignore node
    for(let i = 0; i < irr.length; i++) {
        // current ignore node
        const ing = irr[i]
        // mark as ignored
        ing._ignore = true
        // remove ignore attribute
        ing.removeAttribute('@ignore')
    }
    // get all hexa nodes
    const hrr = root.querySelectorAll('[\\@hexa]')
    // for each hexa node
    for(let i = 0; i < hrr.length; i++) {
        // current hexa node
        const hxa = hrr[i]
        // mark as hexa
        hxa._hexa = true
        // remove hexa attribute
        hxa.removeAttribute('@hexa')
    }
    // check component reference
    if(root.hasAttribute('!comp')) {
        // get component reference
        const comp = root.getAttribute('!comp')
        // set to global components
        Hexa.comps[comp] = that
        // remove references attribute
        root.removeAttribute('!comp')
    }
    // get all element nodes
    const arr = Hexa.getNodes(root, true)
    // for each node
    for(let i = 0; i < arr.length; i++) {
        // current node
        const node = arr[i]
        // get inner references
        if(node.hasAttribute('!ref')) {
            // get reference name
            const name = node.getAttribute('!ref')
            // update reference
            Hexa.updateReferences(name, node, that.refs, index)
            // mark reference
            node._ref = name
            // remove reference attribute
            node.removeAttribute('!ref')
        }
        // get global references
        if(node.hasAttribute('!glob')) {
            // get reference name
            const name = node.getAttribute('!glob')
            // update reference
            Hexa.updateReferences(name, node, Hexa.globs, index)
            // mark reference
            node._glob = name
            // remove reference attribute
            node.removeAttribute('!glob')
        }
    }
}

// method to update reference objects
Hexa.updateReferences = (name, node, obj, index = 0) => {
    // if first item
    if(obj[name] === undefined) {
        // is list mode
        if(index !== null) {
            // set as array
            obj[name] = [node]
        } else {
            // set as single node
            obj[name] = node
        }
    } else if(Array.isArray(obj[name])) {
        // push if an array
        obj[name].push(node)
    } else {
        // convert to array if any pre node
        obj[name] = [obj[name], node]
    }
}

Hexa.removeFromReferences = (node, that) => {
    // get all element nodes
    const arr = Hexa.getNodes(node, true)
    // for each node
    for(let i = 0; i < arr.length; i++) {
        // current node
        const node = arr[i]
        // internal reference name
        const r = node._ref
        // global reference name
        const g = node._glob
        // if internal reference available
        if(r !== undefined) {
            // if is as array
            if(Array.isArray(that.refs[r])) {
                // filter reference node
                that.refs[r] = that.refs[r].filter(x => x !== node)
            } else {
                // delete reference
                delete that.refs[r]
            }
        }
        // if global reference available
        if(g !== undefined) {
            // if is as array
            if(Array.isArray(Hexa.globs[g])) {
                // filter reference node
                Hexa.globs[g] = Hexa.globs[g].filter(x => x !== node)
            } else {
                // delete reference
                delete Hexa.globs[g]
            }
        }
    }
}

// method to update attributes
Hexa.updateAttributes = (bind, data) => {
    // get target key for attributes
    const tar = bind.data
    // get element
    const itm = bind.node
    // old attributes object
    const obj = data[tar] || {}
    // keys array
    const krr = Object.keys(obj)
    // for each key
    for(let i = 0; i < krr.length; i++) {
        // current attribute
        const atr = krr[i]
        // current value
        const val = obj[atr]
        // check for pre value
        if(itm.getAttribute(atr) != val) {
            // set attribute if need
            itm.setAttribute(atr, obj[atr])
        }
    }
    // for each key from bind list
    for(let i = 0; i < bind.list.length; i++) {
        // current attribute
        const atr = bind.list[i]
        // if not in key list
        if(krr.includes(atr) === false) {
            // remove attributes
            itm.removeAttribute(atr)
        }
    }
    // update bind list
    bind.list = krr
}

// method to check eval requirement
Hexa.isExpression = text => {
    return text.match(/\(|\)|\[|\]|\{|\}|\'|\"|\+|\-|\*|\/|\%|\||\?|\:|\;|\,|\=/g)
}

// method to create a fucntion
Hexa.createFunction = (obj, exp) => {
    // get keys of input object
    const krr = Object.keys(obj)
    // get previous match
    const old = Hexa.createFunction.list.find(x => {
        // check for matching expression and keys
        return x.exp === exp && krr.every(y => x.krr.includes(y))
    })
    // return if any previous match
    if(old) { return old.fnc }
    // text to new function
    let text = ``
    // for each key
    for(let i = 0; i < krr.length; i++) {
        // definition line of value
        text += `const ${krr[i]} = arguments[0].${krr[i]}\n`
    }
    // evaluate line
    text += `try { return ${exp}; } catch(e) { return undefined }`
    // create function
    const fnc = Function(text)
    // push to list
    Hexa.createFunction.list.push({ krr : krr, exp : exp, fnc : fnc })
    // return function
    return fnc
}

// created functions list
Hexa.createFunction.list = []

// method to calculate value from expression or path
Hexa.getEvaluateValue = (data, path, evalData) => {
    // check for eval mode by symbols
    if(Hexa.isExpression(evalData)) {
        // create or get previous matching function
        let func = Hexa.createFunction(data, evalData)
        // calculate expression
        return func(data)
    } else {
        // output value
        let out = data
        // for let path key
        for(let i = 0; i < path.length; i++) {
            // current key
            const key = path[i]
            // get nested value
            out = out[key]
            // return if not object
            if(out === undefined) { return out }
        }
        // return selected value
        return out
    }
}

// method to generate text for bind
Hexa.generateText = (obj, data) => {
    // output text
    let out = ''
    // for each text part in object
    for(let i = 0; i < obj.text.length; i++) {
        // current part
        const part = obj.text[i]
        // check part type
        if(typeof part === 'string') {
            // concat string
            out += part
        } else if(typeof part === 'object') {
            // concat state value
            out += Hexa.getEvaluateValue(data, part.path, part.eval)
        }
    }
    // return output text
    return out
}

// method to update for state changes
Hexa.update = (binds, data, states, methods, that) => {
    // get array of change keys
    const krr = Object.keys(states)
    // for each change key
    for(let i = 0; i < krr.length; i++) {
        // current key
        const key = krr[i]
        // update data object
        data[key] = states[key]
        // get required nodes for cange
        const arr = binds.filter(x => {
            // if points in data
            return x.data.points
                // check points with key
                ? x.data.points.includes(key)
                // check data with key
                : x.data === key
                    || x.type === 'show'
                    || x.type === 'list'
        })
        // for each bind
        for(let i = 0; i < arr.length; i++) {
            // current bind
            const bind = arr[i]
            // current node
            const node = bind.node
            // check bind type
            if(bind.type === 'attr') {
                // generate text
                const text = Hexa.generateText(bind.data, data)
                // get bind name
                const name = bind.name
                // only if needs update
                if(node.getAttribute(name) !== text || node[name] !== text) {
                    // update attribute value
                    node.setAttribute(name, text)
                    // update element value
                    node[name] = text
                }
            } else if(bind.type === 'text') {
                // generate text
                const text = Hexa.generateText(bind.data, data)
                // only if needs update
                if(node.data !== text) {
                    // update text node
                    node.data = text
                }
            } else if(bind.type === 'show') {
                // check evaluate value
                if(Hexa.getEvaluateValue(data, [], bind.data)) {
                    // show node if hidden before
                    if(bind.hide) { bind.hide.replaceWith(node) }
                } else {
                    // check for hidden text node
                    if(bind.hide === undefined) {
                        // create hidden text node
                        bind.hide = document.createTextNode('')
                    }
                    // hide node by text node
                    node.replaceWith(bind.hide)
                }
            } else if(bind.type === 'list') {
                // update list
                Hexa.updateList(bind, data, states, methods, that)
            } else if(bind.type === 'attrs') {
                // update attributes
                Hexa.updateAttributes(bind, states)
            }
        }
    }
}

Hexa.updateList = (bind, data, states, methods, that) => {
    // get current elements list
    const eList = bind.data.list
    // get array key
    const arrayKey = bind.data.array
    // create final state
    const last = Object.assign(Object.assign({}, data), states)
    // check for eval requirement
    const dList = Hexa.getEvaluateValue(last, [arrayKey], arrayKey)
    // get array in new states
    const sList = Hexa.getEvaluateValue(states, [arrayKey], arrayKey)
    // check for array in new states
    if(sList) {
        // check array length change
        if(eList.length < dList.length) {
            // for each increased item
            for(let i = eList.length; i < dList.length; i++) {
                // create template clone
                const clone = bind.data.temp.cloneNode(true)
                // get pre child element
                const child = eList[eList.length - 1]
                    // as last list item
                    ? eList[eList.length - 1].root
                    // as text marked node
                    : bind.node
                // inset element next to last element
                child.parentNode.insertBefore(clone, child.nextSibling)
                // get item ndoes
                const nodes = Hexa.getNodes(clone)
                // get binds
                const binds = Hexa.bindTargets(nodes)
                // item data for event
                const edata = {}
                // set event item
                edata[bind.data.item] = dList[i]
                // set event index
                edata[bind.data.index] = i
                // set events
                Hexa.bindMethods(clone, methods, data, edata)
                // set references
                Hexa.setReferences(that, clone, i)
                // push to elements array
                eList.push({ root : clone, binds : binds, states : null })
            }
        } else if(eList.length > dList.length) {
            // splice decreased items
            const rList = eList.splice(dList.length)
            // for each decreased item
            for(let r = 0; r < rList.length; r++) {
                // remove item element
                rList[r].root.remove()
                // remove if any references
                Hexa.removeFromReferences(rList[r].root, that)
            }
        }
    }
    // for each element in list
    for(let i = 0; i < eList.length; i++) {
        // current item
        const item = eList[i]
        // check for new created item
        const stat = item.states === null
            // clone last state as new states
            ? Object.assign(Object.assign({}, data), states)
            // get new states noly
            : states
        // init item states
        if(item.states === null) { item.states = {} }
        // set item in new data
        stat[bind.data.item] = dList[i]
        // set index in new data
        stat[bind.data.index] = i
        // update by states
        Hexa.update(item.binds, item.states, stat, methods, that)
    }
}

// method to load external components
Hexa.loadComponent = (path, tray) => {
    // return promise
    return new Promise((resolve, reject) => {
        // fetch html content
        fetch(path + '.html').then(r => r.text()).then(html => {
            // parse html response
            const doc = new DOMParser().parseFromString(html, 'text/html')
            // get all style elements
            const css = doc.querySelectorAll('style')
            // for each style element
            for(let i = 0; i < css.length; i++) {
                // remove from parse
                css[i].remove()
                // append to document
                document.head.appendChild(css[i])
            }
            // get all script elements
            const scr = doc.querySelectorAll('script:not([src])')
            // for each script element
            for(let i = 0; i < scr.length; i++) {
                // remove script element
                scr[i].remove()
            }
            // get component root
            const com = doc.body.children[0]
            // append component root to tray
            tray.appendChild(com)
            // for each script element
            for(let i = 0; i < scr.length; i++) {
                // create script element
                const ejs = document.createElement('script')
                // set script into element
                ejs.innerHTML = scr[i].innerHTML
                // append to document head
                document.head.appendChild(ejs)
            }
            // resolve component
            resolve(com._hexa)
        }).catch(reject)
    })
}

// method to load all hexa elements
Hexa.load = async (dataset = {}, root = './components/') => {
    // create tray element
    const tray = document.createElement('hexa-load')
    // hide element
    tray.style.display = 'none'
    // append element
    document.body.appendChild(tray)
    // get all hexa elements
    const err = document.querySelectorAll('hexa[component][id]')
    // get array of components
    const arr = Array.from(err).map(x => {
        // get component attribute value
        return x.getAttribute('component')
    }).filter((x, i, a) => {
        // filter duplicated components
        return a.indexOf(x) === i
    })
    // object of components
    const obj = {}
    // for each component
    for(let i = 0; i < arr.length; i++) {
        // current component
        const comp = arr[i]
        // component path
        const path = root + comp
        // load component to object
        obj[comp] = await Hexa.loadComponent(path, tray)
    }
    // remove tray element
    tray.remove()
    // output object
    const out = {}
    // for each component
    for(let a = 0; a < arr.length; a++) {
        // current component
        const comp = arr[a]
        // get hexa components
        const hxrr = document.querySelectorAll(`hexa[component="${comp}"]`)
        // get first item data
        let fdt = null
        // for each hexa element
        for(let i = 0; i < hxrr.length; i++) {
            // current element
            const item = hxrr[i]
            // component name
            const name = item.getAttribute('component')
            // component id
            const cpid = item.getAttribute('id')
            // get new data object
            const data = item.hasAttribute('data')
                // find data from attribute key
                ? dataset[item.getAttribute('data')] || {} : {}
            // store first item data
            if(i === 0) { fdt = { name : name, data : data } }
            // clone component
            const comp = i == 0 ? obj[name] : obj[name].clone(data)
            // store in output object
            out[cpid] = comp
            // set element id
            comp.element.setAttribute('id', cpid)
            // replace element
            item.replaceWith(comp.element)
        }
        // update first component
        obj[fdt.name].update(fdt.data)
    }
    // return output object
    return out
}
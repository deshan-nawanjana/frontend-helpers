(() => {
    // resolutions
    const resolutions = {
        desktop : [
            [1920, 1080],
            [1366, 768],
            [1920, 1200],
            [3840, 2160],
            [2560, 1440],
            [3440, 1440],
            [2560, 1080],
            [3840, 1080],
            [3840, 1600]
        ],
        tablet : [
            [2048, 2732],
            [1668, 2388],
            [1640, 2360],
            [1620, 2160],
            [1488, 2266],
            [1536, 2048],
            [1668, 2224],
            [768, 1024]
        ],
        mobile : [
            [1284, 2778],
            [1290, 2796],
            [1179, 2556],
            [1170, 2532],
            [750, 1334],
            [1080, 2340],
            [1242, 2688],
            [1125, 2436],
            [828, 1792],
            [1080, 1920],
            [640, 1136],
            [640, 960],
            [320, 480]
        ]
    }

    // devices list
    const devices = ['desktop', 'tablet', 'mobile', 'horizontal', 'vertical']

    // elements and props
    const elements = { flex : [], style : [] }

    // method to fetch attributes
    const fetchAttrs = (element, attribute = '') => {
        // check attribute
        if(element.hasAttribute(attribute)) {
            // get attribute value
            const value = element.getAttribute(attribute)
            // remove attribute
            element.removeAttribute(attribute)
            // check value
            if(value === '') {
                // flex with all devices
                return devices
            } else {
                // flex with selected devices
                return devices.filter(device => {
                    // check with rules
                    return value.includes(device)
                })
            }
        } else {
            // default devices
            return attribute === 'visible' ? devices : []
        }
    }

    // flex callback
    const Flex = () => {
        // get all flex elements
        const list_flx = document.querySelectorAll('flex')
        // for each flex element
        for(let i = 0; i < list_flx.length; i++) {
            // current element
            const elem = list_flx[i]
            // continue if included
            if(elements.flex.some(x => x.target === elem)) { continue }
            // add flex node class
            elem.classList.add('_fx')
            // push to elements
            elements.flex.push({
                target : elem,
                class : '_fx',
                attributes : {
                    cols : fetchAttrs(elem, 'cols'),
                    rows : fetchAttrs(elem, 'rows'),
                    reverse : fetchAttrs(elem, 'reverse'),
                    visible : fetchAttrs(elem, 'visible')
                }
            })
        }
        // get all style flex elements
        const list_stl = document.querySelectorAll('style[flex], link[flex]')
        // for each style element
        for(let i = 0; i < list_stl.length; i++) {
            // current element
            const elem = list_stl[i]
            // continue if included
            if(elements.style.some(x => x.target === elem)) { continue }
            // push to elements
            elements.style.push({
                target : elem,
                devices : fetchAttrs(elem, 'flex')
            })
        }
        // get screen size
        const width = window.innerWidth
        const height = window.innerHeight
        // match device details
        const match = { type : resolutions[0], min : null }
        // get device resolution types
        const types = Object.keys(resolutions)
        // for each device type
        for(let i = 0; i < types.length; i++) {
            // current device type
            const type = types[i]
            // get size difference array
            const diffs = resolutions[type].map(x => Math.abs(x[0] - width) + Math.abs(x[1] - height))
            // get minimum difference
            const min = Math.min(...diffs)
            // check minimum with previous match
            if(match.min === null || match.min > min) {
                // store match data
                match.min = min
                match.type = type
            }
        }
        // matches array
        const matches = [match.type, width > height ? 'horizontal' : 'vertical']
        // for each flex element
        for(let i = 0; i < elements.flex.length; i++) {
            // current element
            const elem = elements.flex[i].target
            // current attributes
            const atrs = elements.flex[i].attributes
            // get attribute keys
            const akeys = Object.keys(atrs)
            // array of classes
            const clarr = ['_fx']
            // for each key
            for(let a = 0; a < akeys.length; a++) {
                // current key
                const key = akeys[a]
                // current values
                const arr = atrs[key]
                // check width matches
                const check = arr.some(type => matches.includes(type))
                // check key type
                if(key !== 'visible') {
                    // push to class array
                    if(check) { clarr.push(key[0]) }
                } else {
                    // check match
                    if(check) {
                        // show element
                        elem.classList.remove('_fxh')
                    } else {
                        // hide element
                        elem.classList.add('_fxh')
                    }
                }
            }
            // remove previous class
            elem.classList.remove(elements.flex[i].class)
            // set current class
            elem.classList.add(clarr.join(''))
            // remember current class
            elements.flex[i].class = clarr.join('')
        }

        // for each style element
        for(let i = 0; i < elements.style.length; i++) {
            // current element
            const elem = elements.style[i].target
            // current attributes
            const darr = elements.style[i].devices
            // check devices width matches
            if(darr.some(type => matches.includes(type))) {
                // enable styles
                elem.removeAttribute('type')
            } else {
                // disable styles
                elem.setAttribute('type', 'text')
            }
        }
        // set types on root element
        document.documentElement.setAttribute('device-type', matches.join(' '))
    }

    // callback on window load
    window.addEventListener('load', Flex)
    // callback on window resize
    window.addEventListener('resize', Flex)
})()
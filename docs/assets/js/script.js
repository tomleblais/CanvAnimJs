let el = $("section")
// overview
window.hashBind([/^\/$/, /^\/overview\/?$/i, /^\/home\/?$/i], e => {
    changeLocation("overview")
})
window.hashBind([/^\/$/, /^\/overview\/?.+?$/i, /^\/home\/?.+?$/i], e => {
    window.location.hash = "/overview/" // redirect
})
// docs
// docs/general
window.hashBind(/^\/docs?\/general\/welcome\/?.+?$/i, e => { // /docs/general/welcome/*
    el.load("views/docs.html", (res, status, xhr) => {
        const oReq = new XMLHttpRequest()
        oReq.onload = function() {
            $(".content-container").html(marked(this.response))
            initCode()
        }
        oReq.open("get", "views/docs/general/welcome.md", true)
        oReq.send()
    })
})
window.hashBind(/^\/docs?\/general\/updates?\/+?$/i, e => { // /docs/general/updates/*
    el.load("views/docs.html", (res, status, xhr) => {
        const oReq = new XMLHttpRequest()
        oReq.onload = function() {
            $(".content-container").html(marked(this.response))
            initCode()
        }
        oReq.open("get", "views/docs/general/updates.md", true)
        oReq.send()
        initCode()
    })
})
window.hashBind(/^\/docs?\/general\/+?$/i, e => { // /docs/general/*
    window.location.hash = "/docs/general/welcome/"
})
// docs/examples/*
window.hashBind(/^\/docs?\/examples?\/?.+?$/i, e => { // docs/examples/*
    let char, example, element
    let location = e.hashLocation
    char = e.hashLocation.lastIndexOf("?")
    if (char > 0) {
        element = e.hashLocation.slice(char + 1, e.hashLocation.length)
        location = location.slice(0, char)
    }
    if (location[location.length - 1] == "\/")
        location = location.slice(0, -1)
    
    example = location.slice(location.lastIndexOf("\/") + 1, location.length)

    el.load("views/docs.html", (res, status, xhr) => {
        const oReq = new XMLHttpRequest()
        oReq.onload = function() {
            $(".content-container").html(`<h2>${example}</h2><pre><code class="language-js">${this.response}</code></pre>`)
            initCode()
            scrollToElement(element)
        }
        oReq.open("get", `views/docs/examples/${example}.js`, true)
        oReq.send()
    })
})
// docs/classes/*
window.hashBind(/^\/docs?\/classes\/?.+?$/i, e => { // /docs/classes/*
    let char, class_, element
    let location = e.hashLocation
    char = e.hashLocation.lastIndexOf("?")
    if (char > 0) {
        element = e.hashLocation.slice(char + 1, e.hashLocation.length)
        location = location.slice(0, char)
    }
    if (location[location.length - 1] == "\/")
        location = location.slice(0, -1)
    
    class_ = location.slice(location.lastIndexOf("\/") + 1, location.length)

    el.load("views/docs.html", (res, status, xhr) => {
        const oReq = new XMLHttpRequest()
        oReq.onload = function() {
            loadClass(this.response, class_, document.querySelector(".content-container"))
            initCode()
            scrollToElement(element)
        }
        oReq.open("get", "json/jsdoc.json", true)
        oReq.send()
    })
})
window.hashBind(/^\/docs?\/?.+?$/i, e => { // docs/*
    window.location.hash = "/docs/general/welcome/" // redirect
})
window.hashBind(/^\/about\/?$/i, e => { // about/*
    changeLocation("about")
})
window.hashBind(/^\/about\/?.+?$/i, e => { // about/
    window.location.hash = "/about/" // redirect
})
window.hashBind(/\/.+/g, e => {
    changeLocation("404")
})
function scrollToElement(elementId) {
    elementToScroll = document.querySelector("#" + elementId)
    if (elementToScroll) {
        elementToScroll.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "start"
        })
    }
}

function changeLocation(nav, title, subtitle, scrollTo) {
    let onceContentLoaded = () => {
        if (typeof scrollTo === "string") {
            elementToScroll = document.querySelector("#"+scrollTo)
            if (elementToScroll)
                elementToScroll.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "start"
                })
        }
        init()
    }
    if (typeof title === "string" && typeof subtitle === "string") {
        let loadSection = () => {
            $(".content-container").load(`views/${nav}/${title}.html #${subtitle}`, (res, status, xhr) => {
                initCode()
                xhr.onready = console.log
                onceContentLoaded()
            })
            onceContentLoaded()
        }
        if ($(".content-container").length > 0) {
            loadSection()
        } else {
            el.load(`views/${nav}.html`, () => {
                loadSection()
            })
        }
    } else if (typeof nav === "string") {
        el.load(`views/${nav}.html`, () => {
            initCode()
            onceContentLoaded()
        })
    }
}

window.addEventListener("load", init)
function init() {
    // JS Code
}

let tmp = ""
function initCode() {
    document.querySelectorAll("pre code").forEach(block => {
        let tab = 4 * parseInt(block.dataset.outdent) || 0
        let parent = block.parentElement
        parent.innerHTML = parent.innerHTML.trim()
        block = parent.querySelector("code")
        block.innerHTML = block.innerHTML.trim()
        block.innerHTML = block.innerHTML.replace(RegExp("\\n {" + tab + "}", "g"), "\n")
        hljs.highlightBlock(block)
    })
}
//insérez ce bout de code au début de votre code pour observer les changements de hash dans l'URL
if (!window.HashChangeEvent) (function() {
	var lastURL = document.URL
	window.addEventListener("hashchange", function(e) {
		Object.defineProperty(e, "oldURL", { enumerable: true, configurable: true, value: lastURL })
		Object.defineProperty(e, "newURL", { enumerable: true, configurable: true, value: document.URL })
		lastURL = document.URL
	})
}())

window.locationHashChangedCallbacks = new Map()

function locationHashChanged() {
    let newURL = document.URL
    let hashLocation = window.location.hash.slice(1) // remove the character "#"

    for (const [route, callbacks] of window.locationHashChangedCallbacks) {
        let doCallback = () => {
            callbacks.forEach(callback => {
                callback({
                    newURL: newURL,
                    hashLocation: hashLocation
                })
            })
        }
        let break_ = false
        if (route instanceof Array) {
            for (const r of route) {   
                if (typeof r === "string" && r == hashLocation || r instanceof RegExp && r.test(hashLocation)) {
                    break_ = true
                    doCallback()
                }
            }
        }
        if (break_) {
            break
        } else {
            if (typeof route === "string" && route == hashLocation || route instanceof RegExp && route.test(hashLocation)) {
                doCallback()
                break
            }
        }
        
    }
}
window.addEventListener("load", locationHashChanged)
window.addEventListener("hashchange", locationHashChanged)

window.hashBind = (hashLocation, callback) => {
    if (typeof hashLocation !== "string" && !(hashLocation instanceof RegExp) && !(hashLocation instanceof Array)) throw TypeError("window.hashBind: Argument 1 (hashLocation) is not a string")
    if (typeof callback !== "function") throw TypeError("window.hashBind: Argument 2 (callback) is not a function")

    if (!window.locationHashChangedCallbacks.has(hashLocation)) {
        window.locationHashChangedCallbacks.set(hashLocation, new Array())
    }
    window.locationHashChangedCallbacks.get(hashLocation).push(callback)
    return
}

window.hashUnbind = (hashLocation) => {
    if (typeof hashLocation !== "string" && !(hashLocation instanceof RegExp)) throw TypeError("window.hashUnbind: Argument 1 (hashLocation) is not a string")

    if (window.locationHashChangedCallbacks.has(hashLocation)) {
        window.locationHashChangedCallbacks.delete(hashLocation)
    }
    return
}

window.onload = function (event) {
    if (window.location.hash == "")
        window.location.hash = "/"
}

    const classes = []
    function loadClass(rawData, className, container) {
    let data = JSON.parse(rawData).docs

    container.innerHTML = ""

    var object
    var properties = []
    var methods = []

    data.forEach((obj) => {
        if (obj.memberof == className) {
            if (obj.kind == "member")
                properties.push(obj)
            if (obj.kind == "function")
                methods.push(obj)
        }
        if (obj.kind == "class")
            classes.push(obj.name)
        if (obj.longname == className && obj.kind == "class")
            object = obj
    })
    // sort by name in alphabetic order
    properties.sort(function(before, after) {
        return before.name.localeCompare(after.name)
    })
    // sort by name in alphabetic order
    methods.sort(function(before, after) {
        return before.name.localeCompare(after.name)
    })

    let h1 = document.createElement("h1")
        h1.innerText = className
    container.appendChild(h1)

    if (!classes.includes(className)) {
        const oReq = new XMLHttpRequest()
        oReq.onload = function() {
            container.innerHTML = this.response
        }
        oReq.open("get", "views/404.html", true)
        oReq.send()
    } else {
        if (object.augments) {
            let classNameExtra = document.createElement("span")
                classNameExtra.classList.add("class-name-extra")
                classNameExtra.appendChild(getTypes(object.augments))
            h1.appendChild(classNameExtra)
        }

        if (object.classdesc) {
            let classDesc = document.createElement("p")
                classDesc.classList.add("class-desc")
                classDesc.innerText = object.classdesc
            container.appendChild(classDesc)
        }
        let classConstructor = document.createElement("div")
            classConstructor.id = "class-constructor"
            if (object.params || object.examples) {
                let h2 = document.createElement("h2")
                    h2.innerText = "Constructor"
                classConstructor.appendChild(h2)
                if (object.examples)
                    classConstructor.appendChild(getExample(object.examples))
                if (object.params)
                    classConstructor.appendChild(getTable(object.params))
            }
        container.appendChild(classConstructor)
        
        let classOverview = document.createElement("div")
            classOverview.id = "class-overview"
        container.appendChild(classOverview)

        let col1 = document.createElement("div")
            col1.classList.add("col")
        classOverview.appendChild(col1)
        let col2 = document.createElement("div")
            col2.classList.add("col")
        classOverview.appendChild(col2)

        if (properties.length > 0) {
            let h4 = document.createElement("h4")
                h4.innerText = "Properties"
            col1.appendChild(h4)

            let ul = document.createElement("ul")
            col1.appendChild(ul)

            properties.forEach((item) => {
                if (item.access != "private" && item.access != "protected") {
                    let listItem = document.createElement("li")
                        listItem.classList.add("list-item")
                        let a = document.createElement("a")
                            a.classList.add("a")
                            a.href = `#/docs/classes/${className}/?doc-for-${item.name}`
                            a.innerText = item.name
                        listItem.appendChild(a)
                    ul.appendChild(listItem)
                }
            })
        }

        if (methods.length > 0) {
            let h4 = document.createElement("h4")
                h4.innerText = "Methods"
            col2.appendChild(h4)

            let ul = document.createElement("ul")
            col2.appendChild(ul)

            methods.forEach((item) => {
                if (item.access != "private" && item.access != "protected") {
                    let listItem = document.createElement("li")
                        listItem.classList.add("list-item")
                        let a = document.createElement("a")
                            a.classList.add("a")
                            a.href = `#/docs/classes/${className}/?doc-for-${item.name}`
                            a.innerText = item.name
                        listItem.appendChild(a)
                    ul.appendChild(listItem)
                }
            })
        }

        if (properties.length > 0) {
            let docForProperties = document.createElement("div")
                docForProperties.classList.add("doc-for-properties")
            container.appendChild(docForProperties)
            let h2 = document.createElement("h2")
                h2.innerText = "Properties"
            docForProperties.appendChild(h2)

            properties.forEach((prop) => {
                if (prop.access != "private" && prop.access != "protected") {
                    let classProp = document.createElement("div")
                        classProp.classList.add("class-prop", "class-item")
                    docForProperties.appendChild(classProp)

                    let h3 = document.createElement("h3")
                        h3.innerText = `.${prop.name}`
                    classProp.appendChild(h3)

                    let classItemDetails = document.createElement("div")
                        classItemDetails.classList.add("class-item-details")
                        classItemDetails.id = `doc-for-${prop.name}`
                        let p = document.createElement("p")
                            p.innerText = prop.description
                        let propType = document.createElement("div")
                            propType.classList.add("prop-type")
                            propType.innerText = "Type: "
                            let docsType = document.createElement("span")
                                docsType.classList.add("prop-type")
                                let docsTypeLink = document.createElement("span")
                                    docsTypeLink.classList.add("docs-type-link")
                                    let a = document.createElement("a")
                                        a.href = ""
                                        a.innerText = prop.type.names.join(" | ")
                                    docsTypeLink.appendChild(a)
                                docsType.appendChild(docsTypeLink)
                            propType.appendChild(docsType)
                        classItemDetails.appendChild(p)
                        classItemDetails.appendChild(propType)
                        
                    classProp.appendChild(classItemDetails)
                }
            })
        }
        if (methods.length > 0) {
            let docforMethods = document.createElement("div")
                docforMethods.classList.add("doc-for-methods")
            container.appendChild(docforMethods)
            let h2 = document.createElement("h2")
                h2.innerText = "Methods"
            docforMethods.appendChild(h2)

            methods.forEach((method) => {
                // console.log(method.name, method.params)
                if (method.access != "private" && method.access != "protected") {
                    let classMethod = document.createElement("div")
                        classMethod.classList.add("class-method", "class-item")
                        classMethod.id = `doc-for-${method.name}`
                    docforMethods.appendChild(classMethod)

                    let h3 = document.createElement("h3")
                        h3.innerHTML = `.${method.name}(`
                            if (method.params && method.params.length > 0) {
                                let spanArgs = document.createElement("span")
                                    spanArgs.classList.add("args")
                                let parameters = []
                                method.params.forEach((param) => {
                                    if (param.optional)
                                        parameters.push(`[${param.name}${typeof param.defaultvalue !== "undefined" ? "=" + param.defaultvalue : ""}]`)
                                    else
                                        parameters.push(param.name)
                                })
                                spanArgs.innerText = parameters.join(", ")
                                h3.appendChild(spanArgs)
                            }
                        h3.innerHTML += `)`
                    classMethod.appendChild(h3)

                    let classItemDetails = document.createElement("div")
                        classItemDetails.classList.add("class-item-details")
                        let p = document.createElement("p")
                            p.innerText = method.description

                        let methodReturn = document.createElement("div")
                            methodReturn.classList.add("method-return")
                            methodReturn.innerText = "Returns: "

                            let docsType = document.createElement("span")
                                docsType.classList.add("method-return")
                                let docsTypeLink = document.createElement("span")
                                    docsTypeLink.classList.add("docs-type-link")
                                    var a
                                    if (method.returns) {
                                        a = getTypes(method.returns[0].type.names)
                                    } else {
                                        a = document.createElement("a")
                                        a.href = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined"
                                        a.innerText = "void"
                                    }
                                    docsTypeLink.appendChild(a)
                                docsType.appendChild(docsTypeLink)
                                methodReturn.appendChild(docsType)
                        if (method.examples) {
                            var methodExamples = document.createElement("div") 
                                methodExamples.classList.add("method-examples")
                                let p = document.createElement("p")
                                    p.innerText = "Examples:"
                                methodExamples.appendChild(p)
                                methodExamples.appendChild(getExample(method.examples))
                        }
                        classItemDetails.appendChild(p)
                        if (method.params && method.params.length > 00) {
                            classItemDetails.appendChild(getTable(method.params))
                        }
                        if (typeof paramTableWrapper !== "undefined")
                            classItemDetails.appendChild(paramTableWrapper)
                        classItemDetails.appendChild(methodReturn)
                        if (typeof methodExamples !== "undefined")
                            classItemDetails.appendChild(methodExamples)
                    classMethod.appendChild(classItemDetails)
                }
            })
        }
    }
}

function getTable(params) {
    var paramTableWrapper = document.createElement("div")
        paramTableWrapper.classList.add("param-table-wrapper")
    
        let paramTable = document.createElement("table")
            paramTable.classList.add("param-table")
            let thead = document.createElement("thead")
                var tr = document.createElement("tr")

            let tbody = document.createElement("tbody")

                var columns = ["name", "type", "description"]
                if (params.some((param) => { return (Object.keys(param).length == 5) }))
                    columns = ["name", "type", "optional", "defaultvalue", "description"]
                columns.forEach((col) => {
                    let th = document.createElement("th")
                        th.innerText = col.toUpperCase()
                    tr.appendChild(th)
                })
                thead.appendChild(tr)
                delete tr
                params.forEach((param) => {
                    var tr = document.createElement("tr")
                    columns.forEach((col) => {
                            let td = document.createElement("td")
                                if (param[col]) {
                                    if (typeof param[col] == "object") {
                                        td.innerHTML = getTypes(param[col].names).outerHTML
                                    } else
                                        td.innerText = param[col]
                                } else
                                    td.innerHTML = "&times;"
                        tr.appendChild(td)
                    })
                    tbody.appendChild(tr)
                })
            paramTable.appendChild(thead)
            paramTable.appendChild(tbody)
    return paramTableWrapper.appendChild(paramTable)
}
function getExample(examples) {
    let pre,
        div = document.createElement("div")
        div.classList.add("examples")
        examples.forEach(example => {
            pre = document.createElement("pre")
                let code = document.createElement("code")
                    code.classList.add("js")
                    code.innerText = example
                pre.appendChild(code)
            div.appendChild(pre)
        })
    return div
}
function getTypes(types) {
    let span = document.createElement("span")
    let links = []
    types.forEach((type) => {
        type = type.replace(/\./g, "")
        let a = getType(type)
        links.push(a.outerHTML)
    })
    span.innerHTML = links.join(" or ")
    return span
}
function getType(type) {
    let a = document.createElement("a")
        a.innerText = type
    if (classes.includes(type)) {
        a.href = `#/docs/classes/${type}/`
    } else {
        a.href = `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/${type}`
    }
    return a
}
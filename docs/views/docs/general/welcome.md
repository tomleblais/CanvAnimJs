<div align="center">
    <img src="http://aqua-production.000webhostapp.com/img/logo.svg" alt="CanvAnimJs">
    <br>
    <img src="https://img.shields.io/npm/v/canvanim.svg?maxAge=3600" alt="NPM">
    <img src="https://img.shields.io/npm/dt/canvanim.svg?maxAge=3600" alt="NPM">
    <br>
    <img src="https://nodei.co/npm/canvanim.png?downloads=true&stars=true" alt="NPM">
</div>

# Welcome
Welcome to the CanvAnim v1.0.4 documentation.

### About
Canvanim is a powerful Node.js module for the front-end.

### Installation
This is a [Node.js](https://nodejs.org/en/) module available through the [npm registry](https://www.npmjs.com/).

Before installing, download and install [Node.js](https://nodejs.org/en/download/). Node.js 0.10 or higher is required.
```plaintext
npm i canvanim
```

### Example usage
```js
const el = document.querySelector("canvas.canvanim")
const area = new CanvAnim(el, {
    width: 500,
    height: 300
})

let rect = area.createRectangle(50, 50, 100, 150, {
    backgroundColor: "red",
    borderWidth: 2
})
rect.bbox.on("click", (e) => {
    console.log(`Click in Rectangle in ${e.x}:${e.y}`)
})
```

### Links
* [Documentation](#/docs/general/welcome)
* [Github](https://github.com/LeTomium/CanvAnimJs)
* [NPM](https://www.npmjs.com/package/canvanim)

### Help
If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle nudge in the right direction, please don't hesitate to ask me at the adress **canvanim.js@gmail.com**
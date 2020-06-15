// we take a reference element
const el = document.querySelector("canvas")

// we attach it CanvAnim
const can = new CanvAnim(el, {
    width: 500,
    height: 400
})
// we create a ball item with custom options
const ball = can.createEllipse(250, 200, 12, 12, {
    backgroundColor: "red"
})

// vectors
var dx = 3,
    dy = 3

setInterval(() => {
    // if the ball touch the borders of the canvas
    // we change his direction
    if (ball.bbox.x1 < can.x1 || ball.bbox.x2 > can.x2)
        // vertical rebound
        dx = -dx
    if (ball.bbox.y1 < can.y1 || ball.bbox.y2 > can.y2)
        // horizontal rebound
        dy = -dy
    
    // move the ball
    ball.move(dx, dy)
}, 15)
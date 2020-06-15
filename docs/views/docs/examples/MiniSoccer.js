// get reference element
const el = document.querySelector("canvas")

// we attach it CanvAnim
const can = new CanvAnim(el, {
    width: 500,
    height: 300
})

let size = 50
let url = "ball.png"
var pts = 0

// create a ball item with custom options
const ball = can.createImage(100, 100, size, size, url, {
    borderWidth: 0
})
// create a goal item
const goal = can.createRectangle(400, 50, 60, 200)
// create a score item
const points = can.createText(pts, 5, 280, {
    borderColor: "transparent",
    borderWidth: 0,
    fontSize: 20,
})

shoot = (e) => {
    ball.coords(e.x - size/2, e.y - size/2)
    
    if (goal.bbox.isEnclosedBy(ball.bbox)) {
        // we increment the points
        // and refresh the score
        pts += 1
        points.setText(pts)

        // we stop the ball trajectory (because of the goal net)
        ball.bbox.off("grab", shoot)
                
        // we celebrate the goal by flashing the bars
        goal.configure({
            borderColor: "green"
        })
        setTimeout(() => {
            goal.configure({
                borderColor: "black",
            })
            // we put the ball to the engagement
            ball.coords(100, 100)
            // we whistle
            ball.bbox.on("grab", shoot)
            // and now, we can shoot again!
        }, 500)

    }
}
// we can shoot
ball.bbox.on("grab", shoot)
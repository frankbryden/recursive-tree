let canvas = document.querySelector("#myCanvas")
let ctx = canvas.getContext("2d")
let childCount = 0

/*
Ideas:
    - Each TreeNode has knowledge of its step (or recursive depth), meaning we can issue commands (function calls) to the root node,
    and the tree will be traversed with each node calling all of its children. Within the function call the step (or step range!)
    will be provided, so each node knows wether it needs to act or ignore the call.
    - Exploding trees. Draw up, then erase but starting from the root
    - Write text, where the tree expands in such a way that writes a letter. Perform simultaneously to write a word or sentence.
*/

//Utility functions
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

//Tree is the toplevel container. Responsible for managing the individual components, updating
//and drawing
class Tree {
    constructor(x, y, startLength, dividingLengthFactor, startAngle, dividingAngleFactor, childrenCount) {
        this.x = x
        this.y = y
        this.rootBranch = new Branch(this.x, this.y, this.x+Math.cos(startAngle)*startLength, this.y+Math.sin(startAngle)*startLength)
        this.startLength = startLength
        this.dividingLengthFactor = dividingLengthFactor
        this.startAngle = startAngle
        this.dividingAngleFactor = dividingAngleFactor
        this.childrenCount = childrenCount
        this.root = new TreeNode(this.x, this.y, this.startLength, this.startAngle, 2, childrenCount, this)
        this.maxDepth = 2
        this.done = false
    }

    spawnLevel(){
        if (this.done)
            return
        if (this.maxDepth == 7){
            this.root.propagateCall("LEAVES", this.maxDepth)
            this.done = true
            return
        }
        this.root.propagateCall("SPAWN", this.maxDepth)
        this.maxDepth++
    }

    render(){
        this.root.propagateCall("RENDER", 0, this.maxDepth)
        this.rootBranch.render()
    }
}

//TreeNode is the recursive data structure.
class TreeNode {
    constructor(x, y, length, angle, step, branchFactor, treeParent) {
        this.x = x
        this.y = y
        this.length = length
        this.angle = angle
        this.step = step
        this.branchFactor = branchFactor;
        this.initBranch()
        this.children = []
        this.treeParent = treeParent
    }

    initBranch() {
        const x2 = this.x + Math.cos(this.angle) * this.length
        const y2 = this.y + Math.sin(this.angle) * this.length
        //console.log(`x2 = ${this.x} + ${Math.cos(this.angle)} * ${} -> ${x2}`)
        this.branch = new Branch(this.x, this.y, x2, y2)
    }

    spawnChildren() {
        this.children = []
        //angle calculations
        const angleFactor = Math.pow(this.treeParent.dividingAngleFactor, this.step) * 2*Math.PI//this.treeParent.startAngle
        const angleSpan = angleFactor// * 2*Math.PI
        const angleStep = angleSpan/(this.branchFactor - 1)
        const startAngle = this.angle - angleSpan/2

        //length calculations
        const length = this.treeParent.startLength * Math.pow(this.treeParent.dividingLengthFactor, this.step)
        for (let i = 0; i < this.branchFactor; i++) {
            const angle = startAngle + angleStep * i
            this.children.push(new TreeNode(this.branch.x2, this.branch.y2, length, angle, this.step+1, this.treeParent.childrenCount, this.treeParent))// getRandomInt(this.treeParent.childrenCount - 2, this.treeParent.childrenCount + 5), this.treeParent))
        }
    }

    spawnLeaves() {
        this.branch.addLeaf()
    }

    propagateCall(methodName, step, stepMax) {
        let forMe = false
        if (stepMax == undefined) {
            if (step == this.step) {
                forMe = true
            }    
        } else {
            if (this.step >= step && this.step <= stepMax) {
                forMe = true
            }
        }
        if (forMe) {
            this.performCall(methodName)
        }
        this.children.forEach(c => c.propagateCall(methodName, step, stepMax))
    }

    performCall(methodName){
        switch(methodName) {
            case "SPAWN":
                this.spawnChildren()
                break
            case "RENDER":
                this.render()
                break
            case "LEAVES":
                this.spawnLeaves()
                break
            default:
                console.error(`Unknown method ${methodName}`)
        }
    }

    render() {
        for (let node of this.children) {
            //alert("Here with branch.x = " + branch.x)
            node.branch.render()
        }
    }
}

//Branch is the physical/graphical line, contained and managed by the TreeNode
class Branch {

    constructor(x, y, x2, y2) {
        this.x = x
        this.y = y
        this.x2 = x2
        this.y2 = y2
        this.leaf = null
    }

    addLeaf(){
        this.leaf = new Leaf(this.x2, this.y2, getRandomInt(1, 7))
        console.log("New leaf")
        console.log(this.leaf)
    }

    render() {
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.x2, this.y2)
        ctx.strokeStyle = "brown"
        ctx.stroke()

        if (this.leaf){
            this.leaf.render()
        }
    }
}

class Leaf {
    constructor(x, y, radius) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = "#5db50b"
    }

    render() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI)
        ctx.fillStyle = this.color
        ctx.fill()
    }
}

let tree = new Tree(500, 500, 150, 0.75, 3*Math.PI/2, 0.6, 3)
let count = 0

function update() {
    count++
    if (count > 2) {
        tree.spawnLevel()
        count = 0
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    tree.render()
}

function mainLoop() {
    setTimeout(mainLoop, 30)

    update()
    render()
}

mainLoop()
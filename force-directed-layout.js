$(document).ready(function () {
	              init();
                  });

function Logger(selector) {
    function htmlEscape(x) {
	return x.replace(/&/g, "&amp;")
	    .replace(/</g, "&lt;")
	    .replace(/>/g, "&gt;")
	    .replace(/"/g, "&quot;");
    }
    this.logInner = function (msg) {
	msg = htmlEscape(msg).replace(/ /g, "&nbsp;");
	var child = $("<div/>").html(msg);
	$(selector).prepend(child);
    };
    this.logNum = 0;
    this.log = function (msg) {
	this.logNum += 1;
	this.logInner("" + this.logNum + ") " + msg);
    };
}

var logger;

function initLogger() {
    logger = new Logger("#log");
}

function log(msg) {
    logger.log(msg);
}


function Color(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;

    function toHexDigit(x) {
	var s = "0123456789ABCDEF";
	return s.charAt(x);
    }

    function comp(x) {
	if (x < 0) x = 0;
	else if (x > 255) x = 255;
	return toHexDigit(x / 16) + toHexDigit(x & 15);
    }

    this.colorString = function () {
	return "rgba(" + this.r + ", " + this.g + ", " +
	    this.b + ", " + this.a + ")";
    };

    this.add = function (color) {
	return new Color(this.r + color.r, this.g + color.g,
			 this.b + color.b, this.a + color.a);
    };

    this.subtract = function (color) {
	return new Color(this.r - color.r, this.g - color.g,
			 this.b - color.b, this.a - color.a);
    };
}

function rgb(r, g, b) {
    return new Color(r, g, b, 1);
}

function rgba(r, g, b, a) {
    return new Color(r, g, b, a);
}


function Point(x, y) {
    this.x = x;
    this.y = y;

    this.add = function (p) {
	return new Point(this.x + p.x, this.y + p.y);
    };

    this.subtract = function (p) {
	return new Point(this.x - p.x, this.y - p.y);
    };

    this.scale = function (s) {
	return new Point(this.x * s, this.y * s);
    };

    this.scale2 = function (sx, sy) {
	return new Point(this.x*sx, this.y*sy);
    };

    this.mod = function () {
	return Math.sqrt(this.x*this.x + this.y*this.y);
    };

    this.distance = function (p) {
	return this.subtract(p).mod();
    };
}

var jqCanvas;
var canvasOffset;
var canvasLeftTop;
var canvasWidth, canvasHeight;
var canvasCtx;

function initCanvas() {
    jqCanvas = $("#canvas");
    canvasOffset = jqCanvas.offset();
    canvasLeftTop = new Point(canvasOffset.left, canvasOffset.top);
    canvasWidth = jqCanvas.width();
    canvasHeight = jqCanvas.height();
    canvasCtx = jqCanvas[0].getContext("2d");
}

function drawRect(p, w, h, color) {
    canvasCtx.fillStyle = color.colorString();
    canvasCtx.beginPath();
    canvasCtx.rect(p.x, p.y, w, h);
    canvasCtx.closePath();
    canvasCtx.fill();
}

function drawLine(pa, pb, width, color) {
    canvasCtx.strokeStyle = color.colorString();
    canvasCtx.lineWidth = width;
    canvasCtx.beginPath();
    canvasCtx.moveTo(pa.x, pa.y);
    canvasCtx.lineTo(pb.x, pb.y);
    canvasCtx.stroke();
}

function clearCanvas(color) {
    drawRect(new Point(0,0), canvasWidth, canvasHeight, color);
}

function Node(center, width, height) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.links = [];
    this.pinned = false;
    this.mouseOver = false;
    this.mouseDown = false;
}

function Link(nodeA, posA, nodeB, posB) {
    this.nodeA = nodeA;
    this.posA = posA;
    this.nodeB = nodeB;
    this.posB = posB;

    this.otherNode = function (node) {
	if (node === this.nodeA)
	    return this.nodeB;
	return this.nodeA;
    };
}

var allNodes = [];
var allLinks = [];
var linkIdMap = {};

function nodeId(node) {
    for (var i = 0; i < allNodes.length; ++i) {
    	if (allNodes[i] === node)
    	    return i;
    }
    alert("node not found");
}

function computeLinkId(link) {
    var a = nodeId(link.nodeA);
    var b = nodeId(link.nodeB);
    if (a < b) return "link_" + a + "_" + b;
    return "link_" + b + "_" + a;
}

function addLink(link) {
    var linkId = computeLinkId(link);
    if (linkIdMap.hasOwnProperty(linkId))
	return false;
    linkIdMap[linkId] = 1;
    allLinks.push(link);
    link.nodeA.links.push(link);
    link.nodeB.links.push(link);
    return true;
}

function randInt(n) {
    return Math.floor(n * Math.random());
}

function addRandomNode1(minWidth, maxWidth, minHeight, maxHeight) {
    var cx = randInt(canvasWidth);
    var cy = randInt(canvasHeight);
    var w = minWidth + randInt(maxWidth - minWidth);
    var h = minHeight + randInt(maxHeight - minHeight);
    var center = new Point(cx, cy);
    var node = new Node(center, w, h);
    allNodes.push(node);
}

function addRandomNode() {
    addRandomNode1(20, 150, 10, 40);
}

function randomNode(nodes) {
    return nodes[randInt(nodes.length)];
}

function randomPositionInNode(node) {
    var x = randInt(node.width) - node.width/2;
    var y = randInt(node.height) - node.height/2;
    //return new Point(x, y);
    return new Point(0, 0);
}

function makeRandomLinkBetween(nodeA, nodeB) {
    var posA = randomPositionInNode(nodeA);
    var posB = randomPositionInNode(nodeB);
    var link = new Link(nodeA, posA, nodeB, posB);
    return link;
}

function makeRandomLink() {
    var nodeA = randomNode(allNodes);
    var nodeB;
    while (true) {
	nodeB = randomNode(allNodes);
	if (nodeB !== nodeA)
	    break;
    }
    return makeRandomLinkBetween(nodeA, nodeB);
}

function addRandomLinks(n) {
    for (var i = 0; i < n; ++i) {
	addLink(makeRandomLink());
    }
}

function addLinksToUnconnected() {
    var connectedNodes = [];
    var unconnectedNodes = [];
    for (var i = 0; i < allNodes.length; ++i) {
	var node = allNodes[i];
	if (node.links.length != 0)
	    connectedNodes.push(node);
	else
	    unconnectedNodes.push(node);
    }
    for (var i = 0; i < unconnectedNodes.length; ++i) {
	var node = unconnectedNodes[i];
	var node2 = randomNode(connectedNodes);
	var link = makeRandomLinkBetween(node, node2);
	addLink(link);
	connectedNodes.push(node);
    }
}

function updateLinkForce(link) {
    var pa = link.nodeA.center.add(link.posA);
    var pb = link.nodeB.center.add(link.posB);
    var diff = pb.subtract(pa);
    var diffMod = diff.mod();
    var delta = diffMod - 70;
    var force;
    if (Math.abs(delta) < 1e-6) {
	force = new Point(0, 0);
    }
    else {
	var forceMod = (delta / Math.abs(delta) / 40) * delta * delta;
	force = diff.scale(forceMod / diffMod);
    }
    link.nodeA.force = link.nodeA.force.add(force);
    link.nodeB.force = link.nodeB.force.subtract(force);
}

function updateNodeForce(node1, node2) {
    var diff = node2.center.subtract(node1.center);
    var diffMod = diff.mod();
    var force;
    if (diffMod < 1e-6)
	force = new Point(Math.random()*40, Math.random()*40);
    else
	force = diff.scale2(40*40*100 / (diffMod*diffMod*diffMod),
			    40*40*30 / (diffMod*diffMod*diffMod));
    node1.force = node1.force.subtract(force);
    node2.force = node2.force.add(force);
}

function computeForces() {
    for (var i = 0; i < allNodes.length; ++i)
	allNodes[i].force = new Point(0, 50);
    for (var i = 0; i < allLinks.length; ++i)
	updateLinkForce(allLinks[i]);
    for (var i = 0; i+1 < allNodes.length; ++i) {
	for (var j = i+1; j < allNodes.length; ++j) {
	    updateNodeForce(allNodes[i], allNodes[j]);
	}
    }
}

function moveNodes() {
    var moved = false;
    for (var i = 0; i < allNodes.length; ++i) {
	var node = allNodes[i];
	if (node.pinned || node.mouseDown)
	    continue;
	var delta = node.force.scale(0.05);
	var deltaMod = delta.mod();
	if (deltaMod < 1e-2) {
	    continue;
	}
	if (deltaMod > 50)
	    delta = delta.scale(50 / deltaMod);
	node.center = node.center.add(delta);
	moved = true;
    }
    return moved;
}

function drawAll() {
    var white = rgb(255, 255, 255);
    clearCanvas(white);

    var linkColor = rgba(0, 200, 0, 0.7);
    for (var i = 0; i < allLinks.length; ++i) {
	var link = allLinks[i];
	var pa = link.nodeA.center.add(link.posA);
	var pb = link.nodeB.center.add(link.posB);
	drawLine(pa, pb, 3, linkColor);
    }

    var nodeColor = rgba(250, 0, 0, 0.7);
    var pinnedColor = rgba(250, 250, 0, 0.7);
    for (var i = 0; i < allNodes.length; ++i) {
	var node = allNodes[i];
	var p = node.center.subtract(new Point(node.width/2, node.height/2));
	var color = node.pinned ? pinnedColor : nodeColor;
	if (node.mouseOver)
	    color = color.subtract(rgba(20,0,0,0));
	if (node.mouseDown)
	    color = color.subtract(rgba(30,0,0,0));
	drawRect(p, node.width, node.height, color);
    }

    if ($("#showforces").attr("checked")) {
	var forceColor = rgba(0, 0, 200, 0.2);
	for (var i = 0; i < allNodes.length; ++i) {
	    var node = allNodes[i];
	    var pa = node.center;
	    var pb = pa.add(node.force);
	    drawLine(pa, pb, 1, forceColor);
	}
    }
}

function init() {
    initLogger();
    log("Hello World!");
    initCanvas();

    var firstNode = new Node(new Point(canvasWidth/2, 50), 100, 50);
    firstNode.pinned = true;
    allNodes.push(firstNode);
    for (var i = 0; i < 2+randInt(15); ++i) {
	addRandomNode();
    }

    addRandomLinks(1);
    addLinksToUnconnected();
    addRandomLinks(randInt(allNodes.length));

    computeForces();
    drawAll();

    function update() {
	if ($("#autolayout").attr("checked")) {
	    for (var i = 0; i < 10; ++i) {
		computeForces();
		moveNodes();
	    }
	}
	computeForces();
	drawAll();
    }

    setInterval(update, 100);

    function canvasPoint(ev) {
	return new Point(ev.pageX, ev.pageY).subtract(canvasLeftTop);
    }

    function nodeContains(node, p) {
	if (p.x < node.center.x - node.width/2) return false;
	if (p.x > node.center.x + node.width/2) return false;
	if (p.y < node.center.y - node.height/2) return false;
	if (p.y > node.center.y + node.height/2) return false;
	return true;
    }

    var mouseDown = false;
    var mouseDownPoint = false;
    var dragging = false;
    var dragLastPoint;

    jqCanvas
        .mousemove(
            function (ev) {
		var p = canvasPoint(ev);
		var delta;
		if (mouseDown && !dragging) {
		    dragging = true;
		    dragLastPoint = mouseDownPoint;
		}
		if (dragging) {
		    delta = p.subtract(dragLastPoint);
		    dragLastPoint = p;
		}
		for (var i = 0; i < allNodes.length; ++i) {
		    var node = allNodes[i];
		    node.mouseOver = nodeContains(node, p);
		    if (node.mouseDown)
			node.center = node.center.add(delta);
		}
		return false;
	    })
        .mousedown(
            function (ev) {
		var p = canvasPoint(ev);
		mouseDown = true;
		mouseDownPoint = p;
		for (var i = 0; i < allNodes.length; ++i) {
		    var node = allNodes[i];
		    node.mouseDown = nodeContains(node, p);
		}
		return false;
	    })
        .mouseup(
            function (ev) {
		var pinDragged = dragging && $("#pinondrag").attr("checked");
		mouseDown = false;
		dragging = false;
		var p = canvasPoint(ev);
		for (var i = 0; i < allNodes.length; ++i) {
		    var node = allNodes[i];
		    if (node.mouseDown) {
			node.mouseDown = false;
			if (pinDragged)
			    node.pinned = true;
		    }
		}
		return false;
	    })
        .dblclick(
            function (ev) {
		var p = canvasPoint(ev);
		for (var i = 0; i < allNodes.length; ++i) {
		    var node = allNodes[i];
		    if (nodeContains(node, p))
			node.pinned = !node.pinned;
		}
		return false;
	    });
}

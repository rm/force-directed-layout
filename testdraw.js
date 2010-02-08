$(document).ready(function () {
	init();
});

function htmlEscape(x) {
	return x.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function Logger(selector) {
	this.log = function (msg) {
		msg = htmlEscape(msg).replace(/ /g, "&nbsp;");
		var child = $("<div/>").html(msg);
		$(selector).prepend(child);
	};
}

function RGB(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
	
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
		return "#" + comp(this.r) + comp(this.g) + comp(this.b);
	};
	
	this.add = function (rgb) {
		return new RGB(this.r + rgb.r, this.g + rgb.g, this.b + rgb.b);
	};
	
	this.subtract = function (rgb) {
		return new RGB(this.r - rgb.r, this.g - rgb.g, this.b - rgb.b);
	};
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
}

function Rect(x, y, width, height, options) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	options = options || {};
	this.fillStyle = options.fillStyle || new RGB(0, 0, 0);
	
	this.mouseInside = false;
	this.dragging = false;
	
	this.draw = function (ctx) {
		ctx.fillStyle = this.fillStyle.colorString();
		ctx.beginPath();
		ctx.rect(this.x, this.y, this.width, this.height);
		ctx.closePath();
		ctx.fill();
	};
	
	this.leftTop = function (p) {
		if (p) {
			this.x = p.x;
			this.y = p.y;
			return;
		}
		return new Point(this.x, this.y);
	};
	
	this.contains = function (p) {
		if (p.x < this.x) return false;
		if (p.y < this.y) return false;
		if (p.x > this.x + this.width) return false;
		if (p.y > this.y + this.height) return false;
		return true;
	};	
}

function init() {
	var logger = new Logger("#log");
	var logNum = 0;
	function log(msg) {
		logNum += 1;
		logger.log("" + logNum + ") " + msg);
	}
	log("Hello World!");
	
	var jqCanvas = $("#canvas");
	var canvasOffset = jqCanvas.offset();
	var canvasLeftTop = new Point(canvasOffset.left, canvasOffset.top);
	var ctx = jqCanvas[0].getContext("2d");
	
	var bgRect = new Rect(0, 0, jqCanvas.width(), jqCanvas.height(),
						  {fillStyle : new RGB(0, 255, 0)});
	var r = new Rect(10, 10, 20, 20, {fillStyle: new RGB(255, 0, 0)});
	var r2 = new Rect(100, 100, 20, 20);
	var rects = [r, r2];
	
	function drawAll() {
		bgRect.draw(ctx);
		for (var i = 0; i < rects.length; ++i)
			rects[i].draw(ctx);
	}
	
	drawAll();
	
	function canvasPoint(ev) {
		return new Point(ev.pageX, ev.pageY).subtract(canvasLeftTop);
	}
	
	var dragging = false;
	var dragLastPoint;
	
	jqCanvas.mousemove(function (ev) {
		var p = canvasPoint(ev);
		var dp;
		if (dragging) {
			dp = p.subtract(dragLastPoint);
			dragLastPoint = p;
		}
		log("move " + p.x + "," + p.y);
		var modified = false;
		for (var i = 0; i < rects.length; ++i) {
			var r = rects[i];
			if (r.dragging) {
				r.leftTop(r.leftTop().add(dp));
				modified = true;
			}
			var inside = r.contains(p);
			if (inside != r.mouseInside) {
				r.mouseInside = inside;
				var d = 100;
				var dc = new RGB(d, d, d);
				if (inside)
					r.fillStyle = r.fillStyle.add(dc);
				else
					r.fillStyle = r.fillStyle.subtract(dc);
				modified = true;
			}
		}
		if (modified)
			drawAll();
		return false;
	}).mousedown(function (ev) {
		var p = canvasPoint(ev);
		log("DOWN " + p.x + "," + p.y);
		dragging = true;
		dragLastPoint = p;
		for (var i = 0; i < rects.length; ++i) {
			var r = rects[i];
			r.dragging = r.contains(p);
		}
		return false;
	}).mouseup(function (ev) {
		var p = canvasPoint(ev);
		log("UP   " + p.x + "," + p.y);
		dragging = false;
		for (var i = 0; i < rects.length; ++i) {
			var r = rects[i];
			r.dragging = false;
		}
		return false;
	});
}

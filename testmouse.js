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
    var ctx = jqCanvas[0].getContext("2d");

    ctx.fillStyle = "#00FF00";
    ctx.beginPath();
    ctx.rect(0, 0, jqCanvas.width(), jqCanvas.height());
    ctx.closePath();
    ctx.fill();

    function mousePoint(ev) {
	return {"x":ev.pageX - canvasOffset.left,
		"y":ev.pageY - canvasOffset.top};
    }
    jqCanvas.mousemove(function (ev) {
		           var p = mousePoint(ev);
		           log("move " + p.x + "," + p.y);
	               }).mousedown(function (ev) {
		                        var p = mousePoint(ev);
		                        log("DOWN " + p.x + "," + p.y);
	                            }).mouseup(function (ev) {
		                                   var p = mousePoint(ev);
		                                   log("UP   " + p.x + "," + p.y);
	                                       });
}

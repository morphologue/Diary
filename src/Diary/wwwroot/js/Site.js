/* tslint:disable comment-format */
function makeFooterResizer() {
    // Pixels to reserve under the footer, i.e. at the bottom of the window
    var MARGIN_BOTTOM = 20;
    // Leave this space at the right, which matches the right padding on the nav pills, so that the
    // hr lines up with the rightmost pill.
    var MARGIN_RIGHT = 15;
    // Footer should be positioned no higher on the page than this.
    var MIN_TOP = 200;
    // Cache JQuery objects.
    var $window = $(window);
    var $footer = $("footer");
    var $container = $(".container");
    // Distance from the bottom of the window to position the footer
    var static_height = $footer.height() + MARGIN_BOTTOM;
    return function () {
        if ($footer.css("display") === "none")
            // The footer will be hidden on mobiles, so there's no point resizing.
            return;
        var new_top = $window.height() - static_height;
        $footer.css("top", (new_top > MIN_TOP ? new_top : MIN_TOP) + "px");
        $footer.width($container.width() - MARGIN_RIGHT);
    };
}
$(function () {
    // Install the resizer when the document has loaded.
    var resizer = makeFooterResizer();
    $(window).resize(resizer);
    resizer();
});
//# sourceMappingURL=Site.js.map
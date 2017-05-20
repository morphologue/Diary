/// <reference types="jquery" />
/* tslint:disable comment-format */
function makeFooterResizer() {
    // Pixels to reserve under the footer, i.e. at the bottom of the window
    var MARGIN_BOTTOM = 20;
    // Footer should be positioned no higher on the page than this.
    var MIN_TOP = 200;
    // Cache JQuery objects.
    var $window = $(window);
    var $footer = $("footer");
    // Distance from the bottom of the window to position the footer
    var static_height = $footer.height() + MARGIN_BOTTOM;
    return function () {
        var new_top = $window.height() - static_height;
        $footer.css("top", (new_top > MIN_TOP ? new_top : MIN_TOP) + "px");
    };
}
$(function () {
    // Install the resizer when the document has loaded.
    var resizer = makeFooterResizer();
    $(window).resize(resizer);
    resizer();
});
//# sourceMappingURL=Site.js.map